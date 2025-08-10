/**
 * Pohoda XML Generator
 * Generates XML for Pohoda accounting system integration
 * Standalone implementation for systrix-middleware-nextjs
 */

const { create } = require('xmlbuilder2');
const logger = require('../utils/logger');

class PohodaXMLGenerator {
  constructor() {
    this.version = '2.0';
    this.application = 'CloudVPS Middleware';
  }

  /**
   * Generate XML for invoice creation/update in Pohoda
   * @param {Object} invoiceData - Invoice data from HostBill
   * @param {Object} paymentData - Payment information
   * @returns {string} Generated XML
   */
  generateInvoiceXML(invoiceData, paymentData = null) {
    try {
      logger.info('Generating Pohoda invoice XML', {
        invoiceId: invoiceData.id,
        hasPayment: !!paymentData,
        itemsCount: invoiceData.items?.length || 0
      });

      const xmlObj = {
        dataPack: {
          '@version': this.version,
          '@application': this.application,
          dataPackItem: {
            '@version': this.version,
            invoice: {
              '@action': 'create',
              invoiceHeader: {
                invoiceType: 'issuedInvoice',
                number: invoiceData.id,
                date: this.formatDate(invoiceData.date || new Date()),
                dateDue: this.formatDate(invoiceData.dateDue || new Date()),
                
                // Customer information from HostBill
                partnerIdentity: {
                  name: this.getCustomerName(invoiceData),
                  company: invoiceData.companyname || '',
                  ico: invoiceData.taxid || '',
                  dic: invoiceData.taxid2 || '',
                  address: {
                    street: invoiceData.address1 || '',
                    city: invoiceData.city || '',
                    zip: invoiceData.postcode || '',
                    country: invoiceData.country || 'CZ'
                  },
                  email: invoiceData.email || '',
                  phone: invoiceData.phonenumber || ''
                },

                // Payment information (if provided)
                ...(paymentData && {
                  paymentType: {
                    paymentMethod: this.mapPaymentMethod(paymentData.method),
                    transactionId: paymentData.transactionId,
                    amount: paymentData.amount.toString(),
                    currency: paymentData.currency || 'CZK',
                    paymentDate: this.formatDate(paymentData.date || new Date())
                  },
                  isPaid: 'true',
                  paymentStatus: 'paid'
                }),

                // Invoice totals
                totalPrice: (invoiceData.total || invoiceData.grandtotal || 0).toString(),
                currency: invoiceData.currency || 'CZK',
                
                // Notes
                note: this.generateInvoiceNote(invoiceData, paymentData),
                
                // Reference numbers
                orderNumber: invoiceData.orderid || invoiceData.id,
                variableSymbol: invoiceData.id
              },

              // Invoice items
              invoiceDetail: this.generateInvoiceItems(invoiceData)
            }
          }
        }
      };

      const xml = create(xmlObj).end({ prettyPrint: true });
      
      logger.debug('Pohoda XML generated successfully', {
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
   * Generate invoice items for Pohoda XML
   * @param {Object} invoiceData - Invoice data from HostBill
   * @returns {Array} Invoice items array
   */
  generateInvoiceItems(invoiceData) {
    if (invoiceData.items && Array.isArray(invoiceData.items) && invoiceData.items.length > 0) {
      return invoiceData.items.map(item => ({
        invoiceItem: {
          quantity: (item.qty || 1).toString(),
          text: item.description || `Položka ${item.id}`,
          unitPrice: this.calculateUnitPrice(item).toString(),
          totalPrice: (item.amount || 0).toString(),
          stockItem: {
            code: `CLOUDVPS-${item.id || 'ITEM'}`
          },
          vatRate: '21', // Default 21% VAT for Czech Republic
          vatAmount: this.calculateVAT(item.amount || 0).toString()
        }
      }));
    } else {
      // Default single item if no items provided
      const totalAmount = invoiceData.total || invoiceData.grandtotal || 0;
      return [{
        invoiceItem: {
          quantity: '1',
          text: `CloudVPS služby - Faktura ${invoiceData.id}`,
          unitPrice: totalAmount.toString(),
          totalPrice: totalAmount.toString(),
          stockItem: {
            code: `CLOUDVPS-${invoiceData.id}`
          },
          vatRate: '21',
          vatAmount: this.calculateVAT(totalAmount).toString()
        }
      }];
    }
  }

  /**
   * Calculate unit price from item data
   * @param {Object} item - Invoice item
   * @returns {number} Unit price
   */
  calculateUnitPrice(item) {
    const quantity = parseInt(item.qty) || 1;
    const amount = parseFloat(item.amount) || 0;
    return amount / quantity;
  }

  /**
   * Calculate VAT amount (21% for Czech Republic)
   * @param {number} amount - Base amount
   * @returns {number} VAT amount
   */
  calculateVAT(amount) {
    return parseFloat(amount) * 0.21;
  }

  /**
   * Get customer name from invoice data
   * @param {Object} invoiceData - Invoice data
   * @returns {string} Customer name
   */
  getCustomerName(invoiceData) {
    if (invoiceData.companyname) {
      return invoiceData.companyname;
    }
    
    const firstName = invoiceData.firstname || '';
    const lastName = invoiceData.lastname || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    return fullName || `Zákazník ${invoiceData.id}`;
  }

  /**
   * Generate invoice note
   * @param {Object} invoiceData - Invoice data
   * @param {Object} paymentData - Payment data
   * @returns {string} Invoice note
   */
  generateInvoiceNote(invoiceData, paymentData) {
    let note = `CloudVPS faktura ${invoiceData.id}`;
    
    if (paymentData) {
      note += ` - Platba: ${paymentData.transactionId} přes ${paymentData.method}`;
    }
    
    if (invoiceData.orderid) {
      note += ` - Objednávka: ${invoiceData.orderid}`;
    }

    return note;
  }

  /**
   * Map payment method to Pohoda format
   * @param {string} paymentMethod - Payment method from CloudVPS
   * @returns {string} Pohoda payment method
   */
  mapPaymentMethod(paymentMethod) {
    const mapping = {
      'comgate': 'Platební karta (ComGate)',
      'payu': 'Platební karta (PayU)',
      'banktransfer': 'Bankovní převod',
      'creditcard': 'Platební karta',
      'manual': 'Manuální platba',
      '0': 'Hotovost/Jiné',
      'null': 'Neurčeno'
    };

    return mapping[paymentMethod] || `Platba (${paymentMethod})`;
  }

  /**
   * Format date for Pohoda (YYYY-MM-DD)
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date
   */
  formatDate(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate XML for order creation in Pohoda
   * @param {Object} orderData - Order data
   * @returns {string} Generated XML
   */
  generateOrderXML(orderData) {
    try {
      logger.info('Generating Pohoda order XML', {
        orderId: orderData.orderId,
        itemsCount: orderData.items?.length || 0
      });

      const xmlObj = {
        dataPack: {
          '@version': this.version,
          '@application': this.application,
          dataPackItem: {
            '@version': this.version,
            order: {
              '@action': 'create',
              orderHeader: {
                orderType: 'receivedOrder',
                numberOrder: orderData.orderId,
                date: this.formatDate(new Date()),
                partnerIdentity: {
                  name: orderData.customer?.company || this.getCustomerName(orderData.customer),
                  company: orderData.customer?.company || '',
                  ico: orderData.customer?.ico || '',
                  dic: orderData.customer?.dic || '',
                  address: {
                    street: orderData.customer?.address || '',
                    city: orderData.customer?.city || '',
                    zip: orderData.customer?.postalCode || ''
                  },
                  email: orderData.customer?.email || '',
                  phone: orderData.customer?.phone || ''
                },
                totalPrice: (orderData.total || 0).toString(),
                currency: orderData.currency || 'CZK'
              },
              orderDetail: (orderData.items || []).map(item => ({
                orderItem: {
                  quantity: (item.quantity || 1).toString(),
                  text: item.name || item.description || `Položka ${item.id}`,
                  unitPrice: (item.price || 0).toString(),
                  totalPrice: ((item.price || 0) * (item.quantity || 1)).toString(),
                  stockItem: {
                    code: `CLOUDVPS-${item.productId || item.id}`
                  }
                }
              }))
            }
          }
        }
      };

      const xml = create(xmlObj).end({ prettyPrint: true });
      
      logger.debug('Pohoda order XML generated successfully', {
        orderId: orderData.orderId,
        xmlLength: xml.length
      });

      return xml;

    } catch (error) {
      logger.error('Failed to generate Pohoda order XML', {
        orderId: orderData.orderId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = PohodaXMLGenerator;
