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
import { SubscriptionLinkStatus } from './subscription-link-status';

/**
 * 
 * @export
 * @interface SubscriptionLinkEntity
 */
export interface SubscriptionLinkEntity {
    /**
     * 
     * @type {string}
     * @memberof SubscriptionLinkEntity
     */
    'id': string;
    /**
     * 
     * @type {string}
     * @memberof SubscriptionLinkEntity
     */
    'transactionId': string;
    /**
     * 
     * @type {string}
     * @memberof SubscriptionLinkEntity
     */
    'creationDate': string;
    /**
     * 
     * @type {string}
     * @memberof SubscriptionLinkEntity
     */
    'modificationDate': string;
    /**
     * 
     * @type {string}
     * @memberof SubscriptionLinkEntity
     */
    'value': string;
    /**
     * 
     * @type {Currency}
     * @memberof SubscriptionLinkEntity
     */
    'currency': Currency;
    /**
     * 
     * @type {string}
     * @memberof SubscriptionLinkEntity
     */
    'returnUrl'?: string;
    /**
     * 
     * @type {SubscriptionLinkStatus}
     * @memberof SubscriptionLinkEntity
     */
    'status': SubscriptionLinkStatus;
}



