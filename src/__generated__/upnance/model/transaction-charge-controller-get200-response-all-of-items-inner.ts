/* tslint:disable */
/* eslint-disable */
/**
 * Upnance
 * Upnance API description
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


// May contain unused imports in some cases
// @ts-ignore
import { Currency } from './currency';
// May contain unused imports in some cases
// @ts-ignore
import { TransactionChargeEntity } from './transaction-charge-entity';

/**
 * 
 * @export
 * @interface TransactionChargeControllerGet200ResponseAllOfItemsInner
 */
export interface TransactionChargeControllerGet200ResponseAllOfItemsInner {
    /**
     * 
     * @type {string}
     * @memberof TransactionChargeControllerGet200ResponseAllOfItemsInner
     */
    'id': string;
    /**
     * 
     * @type {string}
     * @memberof TransactionChargeControllerGet200ResponseAllOfItemsInner
     */
    'transactionId': string;
    /**
     * 
     * @type {string}
     * @memberof TransactionChargeControllerGet200ResponseAllOfItemsInner
     */
    'creationDate': string;
    /**
     * 
     * @type {string}
     * @memberof TransactionChargeControllerGet200ResponseAllOfItemsInner
     */
    'modificationDate': string;
    /**
     * 
     * @type {string}
     * @memberof TransactionChargeControllerGet200ResponseAllOfItemsInner
     */
    'value': string;
    /**
     * 
     * @type {Currency}
     * @memberof TransactionChargeControllerGet200ResponseAllOfItemsInner
     */
    'currency': Currency;
}



