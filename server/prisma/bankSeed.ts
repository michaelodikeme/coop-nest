import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function toTitleCase(str: string): string {
  // Handle special cases like "MFB", "PSB", "PLC", etc.
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Keep these abbreviations in uppercase
      if (['mfb', 'psb', 'plc', 'ltd', 'fha', 'cbn', 'tsa'].includes(word.toLowerCase())) {
        return word.toUpperCase();
      }
      // Handle special cases with parentheses
      if (word.includes('(') && word.includes(')')) {
        return word.split('(').map(part => 
          part.includes(')') 
            ? part.split(')').map(p => p ? p.charAt(0).toUpperCase() + p.slice(1) : ')').join('')
            : part.charAt(0).toUpperCase() + part.slice(1)
        ).join('(');
      }
      // Regular word capitalization
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
}

async function main() {
  try {
    // Delete existing banks
    await prisma.bank.deleteMany({});
    console.log('Start seeding banks...');
    
    // Read bank data from file
    const filePath = path.join(__dirname, 'bankCodes.txt');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const bankData = JSON.parse(fileContent);

    // Convert to array, sort by name, and format names
    const bankEntries = Object.entries(bankData)
      .map(([code, name]) => ({
        code,
        name: toTitleCase(name as string)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Process banks in chunks to avoid overwhelming the database
    const chunkSize = 50;
    
    for (let i = 0; i < bankEntries.length; i += chunkSize) {
      const chunk = bankEntries.slice(i, i + chunkSize);
      
      await Promise.all(
        chunk.map(async ({ code, name }) => {
          try {
            await prisma.bank.upsert({
              where: { code },
              update: { name },
              create: {
                code,
                name,
                status: true
              }
            });
          } catch (error) {
            console.error(`Error processing bank: ${name} (${code})`, error);
          }
        })
      );
      
      console.log(`Processed ${i + chunk.length} banks out of ${bankEntries.length}`);
    }

    console.log('Banks seeding completed.');
  } catch (error) {
    console.error('Error reading bank data file:', error);
    throw error;
  }
}

export { main };

// Add at bottom if you want to keep direct execution capability:
if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
