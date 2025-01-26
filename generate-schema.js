const fs = require('fs');
const { mermaidCLI } = require('@mermaid-js/mermaid-cli');

async function generateDiagram() {
  try {
    await mermaidCLI(
      'database-diagram.md',
      'public/images/ProviderCompDBSchema.svg',
      {
        backgroundColor: '#ffffff',
        width: 2000,
        height: 2000,
        cssFile: null,
        configFile: null,
        quiet: true,
        puppeteerConfig: {}
      }
    );
    console.log('Schema diagram generated successfully!');
  } catch (error) {
    console.error('Error generating schema diagram:', error);
  }
}

generateDiagram(); 