/**
 * API endpoint for searching Czech companies by IČO using ARES registry
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { ico } = req.query;

  if (!ico) {
    return res.status(400).json({
      success: false,
      error: 'IČO parameter is required'
    });
  }

  // Validate IČO format (8 digits)
  if (!/^\d{8}$/.test(ico)) {
    return res.status(400).json({
      success: false,
      error: 'IČO must be exactly 8 digits'
    });
  }

  try {
    console.log('🔍 Searching company by IČO:', ico);

    // Call ARES API (Czech business registry)
    const aresUrl = `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`;
    
    const response = await fetch(aresUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CloudVPS-CompanySearch/1.0'
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Firma s tímto IČO nebyla nalezena'
        });
      }
      throw new Error(`ARES API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📋 ARES response received for IČO:', ico);

    // Extract company information from ARES response
    const company = extractCompanyData(data);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Nepodařilo se načíst data firmy'
      });
    }

    console.log('✅ Company data extracted:', {
      name: company.name,
      city: company.city,
      ico: ico
    });

    return res.status(200).json({
      success: true,
      company: company,
      source: 'ares',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error searching company:', error);

    // Return fallback error response
    return res.status(500).json({
      success: false,
      error: 'Chyba při vyhledávání firmy. Zkuste to prosím později.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Extract and normalize company data from ARES API response
 */
function extractCompanyData(aresData) {
  try {
    console.log('🔍 Extracting company data from ARES:', JSON.stringify(aresData, null, 2));

    if (!aresData || !aresData.obchodniJmeno) {
      console.log('❌ Missing obchodniJmeno in ARES data');
      return null;
    }

    // Extract basic company info
    const name = aresData.obchodniJmeno;
    const ico = aresData.ico;
    const dic = aresData.dic;

    // Extract address from sidlo (headquarters)
    let address = '';
    let city = '';
    let zipCode = '';

    if (aresData.sidlo) {
      const sidlo = aresData.sidlo;

      // Build address string
      const addressParts = [];
      if (sidlo.nazevUlice) addressParts.push(sidlo.nazevUlice);
      if (sidlo.cisloDomovni) addressParts.push(sidlo.cisloDomovni);
      if (sidlo.cisloOrientacni) addressParts.push(`/${sidlo.cisloOrientacni}`);

      address = addressParts.join(' ');
      city = sidlo.nazevObce || '';
      zipCode = sidlo.psc ? String(sidlo.psc) : '';
    }

    // Extract legal form (pravniForma is just a code, not object)
    const legalForm = aresData.pravniForma || '';

    const result = {
      name: name,
      ico: ico,
      vatNumber: dic || '',
      address: address,
      city: city,
      zipCode: zipCode,
      legalForm: legalForm,
      isActive: true // ARES returns only active companies
    };

    console.log('✅ Extracted company data:', result);
    return result;

  } catch (error) {
    console.error('❌ Error extracting company data:', error);
    return null;
  }
}
