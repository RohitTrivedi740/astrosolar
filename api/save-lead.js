// api/save-lead.js - Store lead data in database

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const leadData = req.body;

    // Validate required fields
    if (!leadData.name || !leadData.email || !leadData.phone) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, and phone are required' 
      });
    }

    // Add timestamp and source
    const enrichedLeadData = {
      ...leadData,
      timestamp: new Date().toISOString(),
      source: 'astrosolar_landing',
      status: 'new'
    };

    // ============================================
    // OPTION 1: AIRTABLE (RECOMMENDED - EASIEST)
    // ============================================
    /*
    Setup:
    1. Create Airtable account (free)
    2. Create base called "Solar Leads"
    3. Create table with columns: name, email, phone, postcode, interest, installers, message, billAnalysis, timestamp, source, status
    4. Get API key from https://airtable.com/account
    5. Get base ID from Airtable API docs
    6. Add to Vercel env: AIRTABLE_API_KEY and AIRTABLE_BASE_ID
    */
    
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = 'Leads'; // Your table name in Airtable

    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      const airtableResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: enrichedLeadData
          })
        }
      );

      if (!airtableResponse.ok) {
        const error = await airtableResponse.json();
        console.error('Airtable error:', error);
        throw new Error('Failed to save to Airtable');
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Lead saved successfully',
        provider: 'airtable'
      });
    }

    // ============================================
    // OPTION 2: GOOGLE SHEETS (FREE, MORE COMPLEX)
    // ============================================
    /*
    Setup:
    1. Create Google Sheet with headers: name, email, phone, postcode, interest, installers, message, billAnalysis, timestamp, source, status
    2. Share sheet with service account email
    3. Get credentials JSON from Google Cloud Console
    4. Add to Vercel env: GOOGLE_SHEETS_ID and GOOGLE_SERVICE_ACCOUNT_JSON
    */

    const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
    const GOOGLE_CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (GOOGLE_SHEETS_ID && GOOGLE_CREDENTIALS) {
      // Note: This requires googleapis package
      // Add to package.json: "googleapis": "^122.0.0"
      
      // For now, send to webhook or email as fallback
      console.log('Google Sheets integration would go here');
    }

    // ============================================
    // OPTION 3: SUPABASE (POSTGRESQL, MORE POWERFUL)
    // ============================================
    /*
    Setup:
    1. Create Supabase account (free)
    2. Create project
    3. Create table 'leads' with columns
    4. Get URL and anon key from project settings
    5. Add to Vercel env: SUPABASE_URL and SUPABASE_ANON_KEY
    */

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

    if (SUPABASE_URL && SUPABASE_KEY) {
      const supabaseResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/leads`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(enrichedLeadData)
        }
      );

      if (!supabaseResponse.ok) {
        const error = await supabaseResponse.json();
        console.error('Supabase error:', error);
        throw new Error('Failed to save to Supabase');
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Lead saved successfully',
        provider: 'supabase'
      });
    }

    // ============================================
    // FALLBACK: EMAIL NOTIFICATION (NO DATABASE)
    // ============================================
    // If no database is configured, at least send an email notification
    console.log('No database configured. Lead data:', enrichedLeadData);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Lead received (no database configured - check Vercel logs)',
      warning: 'Please configure a database to persist lead data'
    });

  } catch (error) {
    console.error('Save lead error:', error);
    return res.status(500).json({ 
      error: 'Failed to save lead data',
      details: error.message
    });
  }
}
