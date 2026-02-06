// Email API service using server-side API route

class EmailApi {
  async sendPurchaseOrderEmail(orderData, customMessage = '') {
    try {
      console.log('Sending email via server API route:', {
        to: orderData.supplier.email,
        orderNumber: orderData.order.orderNumber
      })

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderData,
          customMessage
        })
      })

      const result = await response.json()

      if (response.ok) {
        console.log('✅ Email sent successfully:', result)
        return result
      } else {
        console.error('❌ Email API Error:', result)
        throw new Error(result.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error)
      throw error
    }
  }

  // Legacy compatibility - this function is now handled server-side
  generatePurchaseOrderEmailContent(order, customMessage = '') {
    console.warn('generatePurchaseOrderEmailContent is deprecated - email generation now happens server-side')
    return null
  }
}

export default new EmailApi()