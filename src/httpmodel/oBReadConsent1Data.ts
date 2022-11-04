/**
 * Account and Transaction API Specification
 * Swagger for Account and Transaction API Specification
 *
 * The version of the OpenAPI document: 3.1.10
 * Contact: ServiceDesk@openbanking.org.uk
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

// import { RequestFile } from './models';

export class OBReadConsent1Data {
  'permissions': Array<PermissionsEnum>;
  /**
   * Specified date and time the permissions will expire.
   * If this is not populated, the permissions will be open ended.
   * All dates in the JSON payloads are represented in ISO 8601 date-time
   * format.
   * All date-time fields in responses must include the timezone.
   * An example is below: 2017-04-05T10:43:07+00:00
   */
  'expirationDateTime'?: Date;
  /**
   * Specified start date and time for the transaction query period.
   * If this is not populated, the start date will be open ended,
   * and data will be returned from the earliest available transaction.
   * All dates in the JSON payloads are represented in ISO 8601 date-time
   * format.
   * All date-time fields in responses must include the timezone.
   * An example is below: 2017-04-05T10:43:07+00:00
   */
  'transactionFromDateTime'?: Date;
  /**
   * Specified end date and time for the transaction query period.
   * If this is not populated, the end date will be open ended,
   * and data will be returned to the latest available transaction.
   * All dates in the JSON payloads are represented in ISO 8601 date-time
   * format.
   * All date-time fields in responses must include the timezone.
   * An example is below: 2017-04-05T10:43:07+00:00
   */
  'transactionToDateTime'?: Date;

  static discriminator: string | undefined = undefined;

  static attributeTypeMap: Array<{ name: string, baseName: string, type: string }> = [
    {
      'name': 'permissions',
      'baseName': 'Permissions',
      'type': 'Array<OBReadConsent1Data.PermissionsEnum>',
    },
    {
      'name': 'expirationDateTime',
      'baseName': 'ExpirationDateTime',
      'type': 'Date',
    },
    {
      'name': 'transactionFromDateTime',
      'baseName': 'TransactionFromDateTime',
      'type': 'Date',
    },
    {
      'name': 'transactionToDateTime',
      'baseName': 'TransactionToDateTime',
      'type': 'Date',
    }];

  static getAttributeTypeMap() {
    return OBReadConsent1Data.attributeTypeMap;
  }
}

export enum PermissionsEnum {
  ReadAccountsBasic = 'ReadAccountsBasic',
  ReadAccountsDetail = 'ReadAccountsDetail',
  ReadBalances = 'ReadBalances',
  ReadBeneficiariesBasic = 'ReadBeneficiariesBasic',
  ReadBeneficiariesDetail = 'ReadBeneficiariesDetail',
  ReadDirectDebits = 'ReadDirectDebits',
  ReadOffers = 'ReadOffers',
  ReadPan = 'ReadPAN',
  ReadParty = 'ReadParty',
  ReadPartyPsu = 'ReadPartyPSU',
  ReadProducts = 'ReadProducts',
  ReadScheduledPaymentsBasic = 'ReadScheduledPaymentsBasic',
  ReadScheduledPaymentsDetail = 'ReadScheduledPaymentsDetail',
  ReadStandingOrdersBasic = 'ReadStandingOrdersBasic',
  ReadStandingOrdersDetail = 'ReadStandingOrdersDetail',
  ReadStatementsBasic = 'ReadStatementsBasic',
  ReadStatementsDetail = 'ReadStatementsDetail',
  ReadTransactionsBasic = 'ReadTransactionsBasic',
  ReadTransactionsCredits = 'ReadTransactionsCredits',
  ReadTransactionsDebits = 'ReadTransactionsDebits',
  ReadTransactionsDetail = 'ReadTransactionsDetail'
}
