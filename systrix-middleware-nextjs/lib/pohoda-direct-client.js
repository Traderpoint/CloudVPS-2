/**
 * Pohoda Direct Client
 * Direct integration with Pohoda mServer API without Dativery
 * Uses official Pohoda XML API via HTTP
 */

const { create } = require('xmlbuilder2');
const logger = require('../utils/logger');

class PohodaDirectClient {
  constructor() {
    this.mServerUrl = process.env.POHODA_MSERVER_URL || 'http://127.0.0.1:444';
    this.mServerPath = '/xml';
    this.username = process.env.POHODA_USERNAME;
    this.password = process.env.POHODA_PASSWORD;
    this.dataFile = process.env.POHODA_DATA_FILE;
    this.enabled = this.isConfigured();

    if (!this.enabled) {
      logger.warn('Pohoda direct client not configured', {
        hasMServerUrl: !!this.mServerUrl,
        hasCredentials: !!(this.username && this.password),
        hasDataFile: !!this.dataFile
      });
    } else {
      logger.info('Pohoda direct client initialized', {
        mServerUrl: this.mServerUrl,
        dataFile: this.dataFile,
        username: this.username
      });
    }
  }

  /**
   * Check if Pohoda direct client is configured
   * @returns {boolean} True if configured
   */
  isConfigured() {
    return !!(
      this.mServerUrl &&
      this.username &&
      this.password &&
      this.dataFile
    );
  }

  /**
   * Create invoice in Pohoda directly via mServer
   * @param {Object} invoiceData - Invoice data from HostBill
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Result
   */
  async createInvoice(invoiceData, paymentData = null) {
    if (!this.enabled) {
      return {
        success: true,
        message: 'Pohoda direct client not configured - skipped',
        configured: false
      };
    }

    try {
      logger.info('Creating invoice in Pohoda via mServer', {
        invoiceId: invoiceData.id,
        hasPayment: !!paymentData,
        mServerUrl: this.mServerUrl
      });

      // Generate XML according to official Pohoda schema
      const xml = this.generateInvoiceXML(invoiceData, paymentData);

      // Send to Pohoda mServer
      const result = await this.sendToMServer(xml);

      if (result.success) {
        logger.info('Invoice created in Pohoda successfully', {
          invoiceId: invoiceData.id,
          pohodaResponse: result.response
        });

        return {
          success: true,
          message: 'Invoice created in Pohoda successfully',
          pohodaInvoiceId: invoiceData.id,
          mServerResponse: result.response
        };
      } else {
        logger.warn('Failed to create invoice in Pohoda', {
          invoiceId: invoiceData.id,
          error: result.error
        });

        return {
          success: false,
          error: result.error,
          invoiceId: invoiceData.id
        };
      }

    } catch (error) {
      logger.error('Exception during Pohoda invoice creation', {
        invoiceId: invoiceData.id,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        invoiceId: invoiceData.id
      };
    }
  }

  /**
   * Generate Pohoda XML according to official schema
   * @param {Object} invoiceData - Invoice data from HostBill
   * @param {Object} paymentData - Payment data
   * @returns {string} Generated XML
   */
  generateInvoiceXML(invoiceData, paymentData = null) {
    try {
      // Create XML according to official Pohoda schema
      const xmlObj = {
        dataPack: {
          '@version': '2.0',
          '@application': 'CloudVPS Middleware',
          '@note': 'CloudVPS automatic invoice sync',
          dataPackItem: {
            '@version': '2.0',
            '@id': `CLOUDVPS-${invoiceData.id}`,
            invoice: {
              '@version': '2.0',
              invoiceHeader: {
                invoiceType: 'issuedInvoice',
                number: {
                  numberRequested: invoiceData.id
                },
                symVar: invoiceData.id,
                date: this.formatDate(invoiceData.date || new Date()),
                dateTax: this.formatDate(invoiceData.date || new Date()),
                dateAccounting: this.formatDate(invoiceData.date || new Date()),
                dateDue: this.formatDate(invoiceData.dateDue || this.addDays(new Date(), 14)),
                
                // Customer information
                partnerIdentity: {
                  address: {
                    name: this.getCustomerName(invoiceData),
                    company: invoiceData.companyname || '',
                    ico: invoiceData.taxid || '',
                    dic: invoiceData.taxid2 || '',
                    street: invoiceData.address1 || '',
                    city: invoiceData.city || '',
                    zip: invoiceData.postcode || '',
                    country: this.getCountryCode(invoiceData.country),
                    email: invoiceData.email || '',
                    phone: invoiceData.phonenumber || ''
                  }
                },

                // Payment type
                paymentType: paymentData ? {
                  paymentMethod: this.mapPaymentMethod(paymentData.method),
                  ids: paymentData.transactionId
                } : {
                  paymentMethod: 'příkazem'
                },

                text: `CloudVPS faktura ${invoiceData.id}${paymentData ? ` - Platba: ${paymentData.transactionId}` : ''}`,
                
                // Notes
                note: this.generateNote(invoiceData, paymentData),
                intNote: `CloudVPS automatická synchronizace - Invoice ID: ${invoiceData.id}${paymentData ? `, Transaction: ${paymentData.transactionId}` : ''}`,

                // Mark as paid if payment data provided
                ...(paymentData && {
                  liquidation: {
                    amountHome: paymentData.amount.toString(),
                    dateLiquidation: this.formatDate(paymentData.date || new Date())
                  }
                })
              },

              // Invoice items
              invoiceDetail: this.generateInvoiceItems(invoiceData),

              // Invoice summary
              invoiceSummary: {
                roundingDocument: 'none',
                roundingVAT: 'none',
                calculateVAT: false,
                homeCurrency: {
                  priceNone: this.calculatePriceWithoutVAT(invoiceData).toString(),
                  priceLow: '0',
                  priceHigh: this.calculateVATAmount(invoiceData).toString(),
                  priceHighSum: this.getTotalAmount(invoiceData).toString()
                }
              }
            }
          }
        }
      };

      const xml = create(xmlObj).end({ 
        prettyPrint: true,
        encoding: 'UTF-8'
      });

      logger.debug('Pohoda XML generated', {
        invoiceId: invoiceData.id,
        xmlLength: xml.length,
        hasPayment: !!paymentData
      });

      return xml;

    } catch (error) {
      logger.error('Failed to generate Pohoda XML', {
        invoiceId: invoiceData.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate invoice items according to Pohoda schema
   * @param {Object} invoiceData - Invoice data
   * @returns {Array} Invoice items
   */
  generateInvoiceItems(invoiceData) {
    if (invoiceData.items && Array.isArray(invoiceData.items) && invoiceData.items.length > 0) {
      return invoiceData.items.map(item => ({
        invoiceItem: {
          text: item.description || `CloudVPS služba ${item.id}`,
          quantity: parseFloat(item.qty) || 1,
          unit: 'ks',
          payVAT: false, // Prices without VAT
          rateVAT: 'high', // 21% VAT
          homeCurrency: {
            unitPrice: this.calculateUnitPriceWithoutVAT(item).toString(),
            price: this.calculateItemPriceWithoutVAT(item).toString(),
            priceVAT: this.calculateItemVATAmount(item).toString(),
            priceSum: (parseFloat(item.amount) || 0).toString()
          },
          code: `CLOUDVPS-${item.id}`,
          stockItem: {
            stockItem: {
              ids: `CLOUDVPS-${item.id}`,
              name: item.description || `CloudVPS služba ${item.id}`
            }
          },
          note: `CloudVPS item ${item.id}`
        }
      }));
    } else {
      // Single item for total amount
      const totalAmount = this.getTotalAmount(invoiceData);
      const priceWithoutVAT = this.calculatePriceWithoutVAT(invoiceData);
      const vatAmount = this.calculateVATAmount(invoiceData);

      return [{
        invoiceItem: {
          text: `CloudVPS služby - Faktura ${invoiceData.id}`,
          quantity: 1,
          unit: 'ks',
          payVAT: false,
          rateVAT: 'high',
          homeCurrency: {
            unitPrice: priceWithoutVAT.toString(),
            price: priceWithoutVAT.toString(),
            priceVAT: vatAmount.toString(),
            priceSum: totalAmount.toString()
          },
          code: `CLOUDVPS-${invoiceData.id}`,
          stockItem: {
            stockItem: {
              ids: `CLOUDVPS-${invoiceData.id}`,
              name: `CloudVPS služby - Faktura ${invoiceData.id}`
            }
          },
          note: `CloudVPS invoice ${invoiceData.id}`
        }
      }];
    }
  }

  /**
   * Send XML to Pohoda mServer
   * @param {string} xml - Generated XML
   * @returns {Promise<Object>} Result
   */
  async sendToMServer(xml) {
    try {
      const url = `${this.mServerUrl}${this.mServerPath}`;
      
      logger.debug('Sending XML to Pohoda mServer', {
        url,
        xmlLength: xml.length,
        dataFile: this.dataFile
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml; charset=UTF-8',
          'Authorization': `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`,
          'STW-Application': 'CloudVPS',
          'STW-Instance': this.dataFile
        },
        body: xml
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`mServer HTTP error: ${response.status} ${response.statusText} - ${responseText}`);
      }

      logger.debug('mServer response received', {
        status: response.status,
        responseLength: responseText.length
      });

      // Parse XML response
      const responseData = this.parsePohodaResponse(responseText);

      return {
        success: true,
        response: responseData,
        rawResponse: responseText
      };

    } catch (error) {
      logger.error('Failed to send XML to Pohoda mServer', {
        error: error.message,
        mServerUrl: this.mServerUrl
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse Pohoda XML response
   * @param {string} xmlResponse - XML response from Pohoda
   * @returns {Object} Parsed response
   */
  parsePohodaResponse(xmlResponse) {
    try {
      // Simple parsing - in production you might want to use a proper XML parser
      const success = xmlResponse.includes('<state>ok</state>') || 
                     xmlResponse.includes('success') ||
                     !xmlResponse.includes('error');

      return {
        success,
        rawXml: xmlResponse,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.warn('Failed to parse Pohoda response', {
        error: error.message
      });
      return {
        success: false,
        error: 'Failed to parse response',
        rawXml: xmlResponse
      };
    }
  }

  // Helper methods
  getCustomerName(invoiceData) {
    if (invoiceData.companyname) return invoiceData.companyname;
    return `${invoiceData.firstname || ''} ${invoiceData.lastname || ''}`.trim() || `Zákazník ${invoiceData.id}`;
  }

  getTotalAmount(invoiceData) {
    return parseFloat(invoiceData.total || invoiceData.grandtotal || 0);
  }

  calculatePriceWithoutVAT(invoiceData) {
    const total = this.getTotalAmount(invoiceData);
    return total / 1.21; // Remove 21% VAT
  }

  calculateVATAmount(invoiceData) {
    const total = this.getTotalAmount(invoiceData);
    const withoutVAT = this.calculatePriceWithoutVAT(invoiceData);
    return total - withoutVAT;
  }

  calculateUnitPriceWithoutVAT(item) {
    const amount = parseFloat(item.amount) || 0;
    const quantity = parseFloat(item.qty) || 1;
    return (amount / quantity) / 1.21;
  }

  calculateItemPriceWithoutVAT(item) {
    const amount = parseFloat(item.amount) || 0;
    return amount / 1.21;
  }

  calculateItemVATAmount(item) {
    const amount = parseFloat(item.amount) || 0;
    const withoutVAT = this.calculateItemPriceWithoutVAT(item);
    return amount - withoutVAT;
  }

  mapPaymentMethod(method) {
    const mapping = {
      'comgate': 'kartou',
      'payu': 'kartou',
      'banktransfer': 'příkazem',
      'creditcard': 'kartou',
      'manual': 'hotově',
      '0': 'hotově'
    };
    return mapping[method] || 'příkazem';
  }

  getCountryCode(country) {
    if (!country) return 'CZ';
    const mapping = {
      'Czech Republic': 'CZ',
      'Slovakia': 'SK',
      'Česká republika': 'CZ',
      'Slovensko': 'SK'
    };
    return mapping[country] || country.substring(0, 2).toUpperCase();
  }

  formatDate(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toISOString().split('T')[0];
  }

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  generateNote(invoiceData, paymentData) {
    let note = `CloudVPS faktura ${invoiceData.id}`;
    
    if (paymentData) {
      note += `\nPlatba: ${paymentData.transactionId} přes ${paymentData.method}`;
      note += `\nČástka: ${paymentData.amount} ${paymentData.currency}`;
    }
    
    if (invoiceData.orderid) {
      note += `\nObjednávka: ${invoiceData.orderid}`;
    }

    return note;
  }

  /**
   * Test connection to Pohoda mServer
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Pohoda direct client not configured',
        configured: false
      };
    }

    try {
      logger.info('Testing Pohoda mServer connection', {
        url: `${this.mServerUrl}${this.mServerPath}`,
        dataFile: this.dataFile
      });

      // Simple test XML
      const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<dataPack version="2.0" application="CloudVPS Test">
  <dataPackItem version="2.0" id="TEST">
    <invoice version="2.0">
      <invoiceHeader>
        <invoiceType>issuedInvoice</invoiceType>
        <text>CloudVPS connection test</text>
      </invoiceHeader>
    </invoice>
  </dataPackItem>
</dataPack>`;

      const result = await this.sendToMServer(testXml);

      if (result.success) {
        logger.info('Pohoda mServer connection test successful');
        return {
          success: true,
          message: 'Connection to Pohoda mServer successful',
          mServerUrl: this.mServerUrl,
          dataFile: this.dataFile
        };
      } else {
        logger.warn('Pohoda mServer connection test failed', {
          error: result.error
        });
        return {
          success: false,
          error: result.error,
          mServerUrl: this.mServerUrl
        };
      }

    } catch (error) {
      logger.error('Pohoda mServer connection test exception', {
        error: error.message
      });
      return {
        success: false,
        error: error.message,
        mServerUrl: this.mServerUrl
      };
    }
  }

  /**
   * Get client status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      enabled: this.enabled,
      configured: this.isConfigured(),
      mServerUrl: this.mServerUrl,
      dataFile: this.dataFile,
      username: this.username,
      hasPassword: !!this.password,
      type: 'direct_mserver'
    };
  }
}

module.exports = PohodaDirectClient;
