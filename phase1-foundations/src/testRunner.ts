import { GeminiService } from './geminiService.js';

async function runMockValidation() {
  const service = new GeminiService();

  const mockEmail = `
    From: sarah.jones@cloudtech-solutions.com
    To: sales@aetherai.io
    Date: May 28, 2026

    Subject: URGENT: Custom Enterprise Integration Query & Potential 500-Seat Deal

    Hi Sales Team,

    I am the Director of Architecture at CloudTech Solutions. We are highly interested in migrating our customer pipelines to your AetherAI platform. 

    We currently have a team of 500 engineers who would require custom dashboards, advanced vector indexing, and isolated multi-tenant schemas.
    
    Can we schedule a deep-dive call this Friday at 2:00 PM EST? Also, we are reviewing competitors like VertexAI and LangSmith, but your focus on MCP tool integration is our primary interest. 

    If we proceed, our procurement timeline is extremely tight—we would need the contract signed and sharded instances deployed by June 15, 2026. Please let me know what pricing packages look like for enterprise contracts of this scale.

    Best,
    Sarah Jones
    Director of Architecture, CloudTech Solutions
    Office: (555) 982-1402
  `;

  console.log('🤖 Initializing structured extraction for mock input...');
  console.log('----------------------------------------------------');
  
  try {
    const startTime = Date.now();
    const result = await service.extractEmailMetadata(mockEmail);
    const duration = Date.now() - startTime;

    console.log(`✅ Extraction Completed successfully in ${duration}ms!`);
    console.log('\n🔍 Parsed Structured Output Structure:\n');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Failed to run structured extraction test:', error);
    console.log('\n💡 Tip: Make sure you have created your `.env` file with a valid `GEMINI_API_KEY`.');
  }
}

runMockValidation();
