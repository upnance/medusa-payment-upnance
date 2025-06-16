import {
  AddressDTO,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  BigNumberRawValue,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types";
import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils";
import BigNumber from "bignumber.js";
import {
  Acquirer,
  AddressModel,
  Configuration,
  Country,
  Currency,
  Gateway,
  PayInStatus,
  UpnanceApi,
} from "../__generated__/upnance";
import {
  API_PRODUCTION_URL,
  API_STAGING_URL,
  isChecksumValid,
  UPNANCE_IDENTIFIER,
  UpnanceOptions,
  WEBHOOK_HEADER_CHECKSUM_NAME,
  WebhookPayload,
} from "../model";

type TransactionModel = {
  id: string;
  status: PayInStatus;
  amount: string;
  currency: Currency;
};

export class UpnanceProvider extends AbstractPaymentProvider<UpnanceOptions> {
  static identifier = UPNANCE_IDENTIFIER;

  static validateOptions(options: UpnanceOptions): void | never {
    if (!options.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "API key is required in the provider's options."
      );
    }

    if (!options.accountId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Account id is required in the provider's options."
      );
    }

    if (!options.environment) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Environment is required in the provider's options."
      );
    }
  }

  private readonly upnanceClient: UpnanceApi;
  private readonly options: UpnanceOptions;

  constructor(container: any, options: UpnanceOptions) {
    super(container, options);

    const basePath =
      new URL(
        "",
        options.environment === "production"
          ? API_PRODUCTION_URL
          : API_STAGING_URL
      ).href + "/";

    this.upnanceClient = new UpnanceApi(
      new Configuration({
        apiKey: options.apiKey,
        basePath,
      })
    );
    this.options = options;
  }

  public async getPaymentStatus(
    args: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const { id } = args.data as TransactionModel;

    const { data: transaction } =
      await this.upnanceClient.checkoutControllerFind({ id });

    switch (transaction.status) {
      case PayInStatus.SUCCESS:
        return { status: PaymentSessionStatus.CAPTURED };
      case PayInStatus.AUTHORIZED:
        return { status: PaymentSessionStatus.AUTHORIZED };
      case PayInStatus.CREATED:
        return { status: PaymentSessionStatus.PENDING };
      case PayInStatus.FAILURE:
        return { status: PaymentSessionStatus.ERROR };
      case PayInStatus.CANCELLED:
        return { status: PaymentSessionStatus.CANCELED };
      default:
        return { status: PaymentSessionStatus.PENDING };
    }
  }

  public async initiatePayment(
    args: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    try {
      const currency = args.currency_code.toUpperCase() as Currency;

      const { data: payment } =
        await this.upnanceClient.paymentControllerCreate({
          payInCardCreateControllerArgs: {
            accountId: this.options.accountId,
            acquirer: Acquirer.CLEARHAUS,
            gateway: Gateway.QUICKPAY,
            currency,
            value: new BigNumber(args.amount.toString())
              .multipliedBy(100)
              .toString(),
            invoiceAddress: this.newAddress(
              args.context?.customer?.billing_address ?? undefined
            ),
          },
        });

      await this.upnanceClient.paymentControllerLink({
        id: payment.id,
        payInCardLinkControllerArgs: { charge: this.options.autoCapture },
      });

      return {
        data: {
          ...payment,
        },
        id: payment.id,
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "An error occurred while initiating payment"
      );
    }
  }

  public async authorizePayment(
    args: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    try {
      const data = args.data as TransactionModel;

      const { status } = await this.getPaymentStatus({ data });

      return { status, data };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "An error occurred while authorizing payment"
      );
    }
  }

  public async capturePayment(
    args: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    try {
      const data = args.data as TransactionModel;

      const { status } = await this.getPaymentStatus({ data });
      if (status === PaymentSessionStatus.CAPTURED) {
        return {
          data: await this.retrievePayment({ data }),
        };
      }

      const { data: paymentCharge } =
        await this.upnanceClient.paymentControllerCharge({
          id: data.id,
        });

      return {
        data: {
          ...paymentCharge,
        },
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "An error occurred while capturing payment"
      );
    }
  }

  public async refundPayment(
    args: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    try {
      const { value } = args.amount as BigNumberRawValue;

      const data = args.data as TransactionModel;
      const { data: refund } = await this.upnanceClient.paymentControllerRefund(
        {
          id: data.id,
          payInCardRefundControllerArgs: {
            value: new BigNumber(value).multipliedBy(100).toString(),
          },
        }
      );

      return {
        data: {
          ...refund,
        },
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "An error occurred while refunding payment"
      );
    }
  }

  public async cancelPayment(
    args: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    return { data: args.data };
  }

  public async retrievePayment(
    args: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    try {
      const data = args.data as TransactionModel;
      const { data: transaction } =
        await this.upnanceClient.checkoutControllerFind({
          id: data.id,
        });

      return {
        data: {
          ...transaction,
        },
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "An error occurred while retrieving payment"
      );
    }
  }

  public async updatePayment(
    args: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    return { data: args.data };
  }

  public async deletePayment(
    args: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return { data: args.data };
  }

  public async getWebhookActionAndData(
    args: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    if (
      !isChecksumValid(
        args.data,
        String(args.headers[WEBHOOK_HEADER_CHECKSUM_NAME]),
        this.options.apiKeySecret
      )
    ) {
      throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Invalid checksum");
    }

    const data = args.data as WebhookPayload;

    try {
      return {
        action: this.newPaymentAction(data.status),
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "An error occurred while processing the webhook"
      );
    }
  }

  private newAddress(
    address: Partial<AddressDTO> | undefined
  ): AddressModel | undefined {
    if (
      !address?.address_1 ||
      !address?.city ||
      !address?.province ||
      !address?.postal_code ||
      !address?.country_code
    ) {
      return undefined;
    }

    const country = address.country_code.toUpperCase() as Country;

    if (!Object.values(Country).includes(country)) {
      return undefined;
    }

    return {
      addressLine1: address.address_1,
      addressLine2: address.address_2 ?? undefined,
      city: address.city,
      stateOrCounty: address.province,
      postalCode: address.postal_code,
      country,
    };
  }

  private newPaymentAction(status: PayInStatus): PaymentActions {
    switch (status) {
      case PayInStatus.SUCCESS:
        return PaymentActions.SUCCESSFUL;
      case PayInStatus.AUTHORIZED:
        return PaymentActions.AUTHORIZED;
      case PayInStatus.CREATED:
        return PaymentActions.PENDING;
      case PayInStatus.FAILURE:
        return PaymentActions.FAILED;
      case PayInStatus.CANCELLED:
        return PaymentActions.CANCELED;
      default:
        return PaymentActions.PENDING;
    }
  }
}
