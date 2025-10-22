// Simple test script to verify form submission
const testFormSubmission = async () => {
  const API_BASE_URL = 'http://localhost:5000';
  
  // Test data
  const formData = new FormData();
  formData.append('vendorName', 'Test Vendor');
  formData.append('vendorAddress', 'Test Address');
  formData.append('contactNumber', '1234567890');
  formData.append('email', 'test@example.com');
  formData.append('billNo', 'TEST-001');
  formData.append('billDate', '2024-01-15');
  formData.append('department', '507f1f77bcf86cd799439011'); // Sample ObjectId
  formData.append('category', 'capital');
  formData.append('type', 'capital');
  formData.append('grandTotal', '1000');
  formData.append('items', JSON.stringify([
    {
      particulars: 'Test Item',
      quantity: 1,
      rate: 1000,
      cgst: 9,
      sgst: 9,
      amount: 1000,
      grandTotal: 1180
    }
  ]));
  
  // Create a dummy PDF file
  const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF';
  const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
  formData.append('billFile', pdfBlob, 'test-bill.pdf');
  
  try {
    console.log('Testing form submission...');
    
    // Get auth token (you'll need to replace this with actual token)
    const token = localStorage.getItem('token') || 'your-auth-token-here';
    
    const response = await fetch(`${API_BASE_URL}/api/assets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('Response data:', result);
    
    if (response.ok) {
      console.log('✅ Form submission successful!');
    } else {
      console.log('❌ Form submission failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

// Run the test if in browser environment
if (typeof window !== 'undefined') {
  console.log('Run testFormSubmission() in browser console to test');
} else {
  // Node.js environment
  testFormSubmission();
}