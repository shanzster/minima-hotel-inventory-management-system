import { NextResponse } from 'next/server'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

export async function POST(request) {
  try {
    const { orderData, customMessage } = await request.json()
    const { order, supplier, customSubject, customContent } = orderData

    // Get API key from server-side environment
    const apiKey = process.env.BREVO_API_KEY
    const senderEmail = process.env.BREVO_SENDER_EMAIL
    
    console.log('🔍 Environment check:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      senderEmail: senderEmail || 'not set'
    })
    
    if (!apiKey) {
      console.error('❌ BREVO_API_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'Email service not configured - API key missing' },
        { status: 500 }
      )
    }

    // Generate default email content
    const defaultSubject = `Purchase Order ${order.orderNumber} - ${order.supplier.name}`
    const emailContent = generatePurchaseOrderEmailContent(order, customMessage || '')

    const emailData = {
      sender: {
        name: "Minima Hotel Inventory",
        email: senderEmail || "seanthetechyyy@gmail.com"
      },
      to: [
        {
          email: supplier.email,
          name: supplier.contactPerson || supplier.name
        }
      ],
      subject: customSubject || defaultSubject,
      htmlContent: customContent || emailContent,
      textContent: stripHtml(customContent || emailContent)
    }

    console.log('📧 Sending email with data:', {
      from: emailData.sender.email,
      to: emailData.to[0].email,
      subject: emailData.subject,
      apiKeyPrefix: apiKey.substring(0, 20) + '...'
    })

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(emailData)
    })

    const result = await response.json()
    
    console.log('📨 BREVO Response:', {
      status: response.status,
      ok: response.ok,
      result: result
    })

    if (response.ok) {
      console.log('✅ Email sent successfully via BREVO:', result)
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'Purchase order email sent successfully'
      })
    } else {
      console.error('❌ BREVO API Error:', result)
      
      // Provide more specific error messages
      let errorMessage = result.message || result.error || 'Failed to send email'
      if (result.error === 'API Key is not enabled') {
        errorMessage = 'BREVO API key is not enabled. Please verify your BREVO account and activate your API key.'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: result,
          troubleshooting: result.error === 'API Key is not enabled' ? 
            'Please check your BREVO account verification status and API key permissions.' : null
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generatePurchaseOrderEmailContent(order, customMessage = '') {
  const itemsTable = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.itemName || item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.itemUnit || item.unit}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${(item.unitCost || 0).toLocaleString()}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${((item.quantity || 0) * (item.unitCost || 0)).toLocaleString()}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Purchase Order ${order.orderNumber}</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Purchase Order</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">${order.orderNumber}</p>
        </div>

        <!-- Custom Message -->
        ${customMessage ? `
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #3b82f6;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">Message from Minima Hotel</h3>
          <p style="margin: 0; white-space: pre-line;">${customMessage}</p>
        </div>
        ` : ''}

        <!-- Order Information -->
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">Order Information</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <p style="margin: 0 0 5px 0; font-weight: 600; color: #6b7280;">Order Number:</p>
              <p style="margin: 0; font-size: 16px;">${order.orderNumber}</p>
            </div>
            <div>
              <p style="margin: 0 0 5px 0; font-weight: 600; color: #6b7280;">Status:</p>
              <p style="margin: 0; font-size: 16px; color: #059669; font-weight: 600;">${order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}</p>
            </div>
            <div>
              <p style="margin: 0 0 5px 0; font-weight: 600; color: #6b7280;">Priority:</p>
              <p style="margin: 0; font-size: 16px;">${order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}</p>
            </div>
            <div>
              <p style="margin: 0 0 5px 0; font-weight: 600; color: #6b7280;">Expected Delivery:</p>
              <p style="margin: 0; font-size: 16px;">${order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : 'Not specified'}</p>
            </div>
          </div>

          ${order.notes ? `
          <div>
            <p style="margin: 0 0 5px 0; font-weight: 600; color: #6b7280;">Notes:</p>
            <p style="margin: 0; font-size: 14px; background: #f9fafb; padding: 10px; border-radius: 4px;">${order.notes}</p>
          </div>
          ` : ''}
        </div>

        <!-- Order Items -->
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">Order Items</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Item</th>
                <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Qty</th>
                <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Unit</th>
                <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Unit Price</th>
                <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsTable}
            </tbody>
          </table>

          <div style="text-align: right; padding-top: 15px; border-top: 2px solid #e5e7eb;">
            <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">
              Total Amount: <span style="color: #059669;">₱${(order.totalAmount || 0).toLocaleString()}</span>
            </p>
          </div>
        </div>

        <!-- Contact Information -->
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
          <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">Contact Information</h2>
          <p style="margin: 0 0 10px 0;"><strong>Minima Hotel Inventory Department</strong></p>
          <p style="margin: 0 0 5px 0;">Email: inventory@minimahotel.com</p>
          <p style="margin: 0 0 5px 0;">Phone: +63 (02) 8123-4567</p>
          <p style="margin: 0;">For any questions regarding this purchase order, please contact us using the information above.</p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0;">This is an automated email from Minima Hotel Inventory Management System.</p>
          <p style="margin: 5px 0 0 0;">Generated on ${new Date().toLocaleString()}</p>
        </div>

      </body>
    </html>
  `
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}