// ============================================================
// KOGVANTAGE — Data Anonymizer
// Consistent replacement of names, emails, personnel numbers
// Same input always produces same output (deterministic mapping)
// ============================================================

const FIRST_NAMES = [
  'Aria', 'Blake', 'Caden', 'Dana', 'Ellis', 'Finn', 'Gemma', 'Harper',
  'Ira', 'Jules', 'Kai', 'Lena', 'Morgan', 'Nico', 'Olive', 'Parker',
  'Quinn', 'Reese', 'Sage', 'Tatum', 'Uma', 'Val', 'Wren', 'Xander',
  'Yara', 'Zion', 'Avery', 'Briar', 'Camden', 'Drew', 'Emery', 'Frankie',
  'Gray', 'Hayden', 'Indigo', 'Jordan', 'Kendall', 'Lane', 'Marlow', 'Nova',
  'Oakley', 'Peyton', 'Remy', 'Sawyer', 'Teal', 'Unity', 'Vesper', 'Winter',
];

const LAST_NAMES = [
  'Aldridge', 'Beckett', 'Calloway', 'Devereaux', 'Evanston', 'Fairchild',
  'Greyson', 'Holloway', 'Irvington', 'Jasper', 'Kensington', 'Langford',
  'Mercer', 'Northcott', 'Oakwood', 'Pemberton', 'Quillen', 'Radcliffe',
  'Sinclair', 'Thornton', 'Underwood', 'Vance', 'Whitmore', 'Xavier',
  'Yarborough', 'Zimmerman', 'Ashford', 'Blackwell', 'Castillo', 'Dunmore',
  'Elsworth', 'Fletcher', 'Gallagher', 'Hartfield', 'Ingram', 'Jennings',
  'Knox', 'Lancaster', 'Montague', 'Nash', 'Osborne', 'Prescott',
  'Ramsey', 'Sterling', 'Townsend', 'Upton', 'Vaughn', 'Wellington',
];

const DOMAINS = [
  'acme-corp.co.nz', 'nexus-tech.co.nz', 'summit-digital.co.nz',
  'vertex-solutions.co.nz', 'atlas-group.co.nz',
];

const ROLES = [
  'Platform Engineer', 'Solutions Architect', 'Product Manager',
  'Security Analyst', 'Cloud Engineer', 'DevOps Lead',
  'UX Designer', 'Data Engineer', 'Technical Lead',
  'Business Analyst', 'Delivery Manager', 'Infrastructure Specialist',
  'Identity Engineer', 'Endpoint Specialist', 'Collaboration Lead',
  'Automation Engineer', 'Network Architect', 'Service Manager',
];

const COST_CENTERS = [
  'CC-10200', 'CC-10300', 'CC-10400', 'CC-10500', 'CC-10600',
  'CC-20100', 'CC-20200', 'CC-20300', 'CC-30100', 'CC-30200',
];

const WBSE_PREFIXES = [
  'P.70001', 'P.70002', 'P.70003', 'P.70004', 'P.70005',
  'P.80001', 'P.80002', 'P.80003', 'P.90001', 'P.90002',
];

// Deterministic hash for consistent mapping
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export class Anonymizer {
  private nameMap: Map<string, string> = new Map();
  private emailMap: Map<string, string> = new Map();
  private personnelMap: Map<string, string> = new Map();
  private wbseMap: Map<string, string> = new Map();
  private costCenterMap: Map<string, string> = new Map();
  private counter = 0;

  // Get or create a consistent anonymous name for a real name
  anonymizeName(realName: string): string {
    if (!realName || realName.trim() === '') return realName;
    const key = realName.trim().toLowerCase();
    if (this.nameMap.has(key)) return this.nameMap.get(key)!;

    const hash = simpleHash(key);
    const first = FIRST_NAMES[hash % FIRST_NAMES.length];
    const last = LAST_NAMES[(hash + this.counter) % LAST_NAMES.length];
    const anonName = `${first} ${last}`;
    this.nameMap.set(key, anonName);
    this.counter++;
    return anonName;
  }

  // Get or create a consistent anonymous email for a real email
  anonymizeEmail(realEmail: string): string {
    if (!realEmail || realEmail.trim() === '') return realEmail;
    const key = realEmail.trim().toLowerCase();
    if (this.emailMap.has(key)) return this.emailMap.get(key)!;

    // Derive from the anonymized name if we can find it
    const namePart = key.split('@')[0];
    const hash = simpleHash(key);
    const first = FIRST_NAMES[hash % FIRST_NAMES.length].toLowerCase();
    const last = LAST_NAMES[(hash + this.counter) % LAST_NAMES.length].toLowerCase();
    const domain = DOMAINS[hash % DOMAINS.length];
    const anonEmail = `${first}.${last}@${domain}`;
    this.emailMap.set(key, anonEmail);
    this.counter++;
    return anonEmail;
  }

  // Generate consistent anonymous personnel number
  anonymizePersonnelNumber(realNumber: string): string {
    if (!realNumber || realNumber.trim() === '' || realNumber === '0') return realNumber;
    const key = realNumber.trim();
    if (this.personnelMap.has(key)) return this.personnelMap.get(key)!;

    const hash = simpleHash(key);
    const anonNum = `D${String(10000 + (hash % 90000)).padStart(5, '0')}`;
    this.personnelMap.set(key, anonNum);
    return anonNum;
  }

  // Anonymize WBSE codes (keep structure, change identifiers)
  anonymizeWBSE(realWBSE: string): string {
    if (!realWBSE || realWBSE.trim() === '') return realWBSE;
    const key = realWBSE.trim();
    if (this.wbseMap.has(key)) return this.wbseMap.get(key)!;

    const hash = simpleHash(key);
    const prefix = WBSE_PREFIXES[hash % WBSE_PREFIXES.length];
    const suffix = String(hash % 1000).padStart(3, '0');
    const anonWBSE = `${prefix}.${suffix}`;
    this.wbseMap.set(key, anonWBSE);
    return anonWBSE;
  }

  // Anonymize cost center
  anonymizeCostCenter(realCC: string): string {
    if (!realCC || realCC.trim() === '') return realCC;
    const key = realCC.trim();
    if (this.costCenterMap.has(key)) return this.costCenterMap.get(key)!;

    const hash = simpleHash(key);
    const anonCC = COST_CENTERS[hash % COST_CENTERS.length];
    this.costCenterMap.set(key, anonCC);
    return anonCC;
  }

  // Get a role for a person (deterministic)
  getRole(name: string): string {
    const hash = simpleHash(name.toLowerCase());
    return ROLES[hash % ROLES.length];
  }

  // Get summary of all mappings (for audit/debug)
  getSummary(): {
    names: number;
    emails: number;
    personnelNumbers: number;
    wbseCodes: number;
    costCenters: number;
  } {
    return {
      names: this.nameMap.size,
      emails: this.emailMap.size,
      personnelNumbers: this.personnelMap.size,
      wbseCodes: this.wbseMap.size,
      costCenters: this.costCenterMap.size,
    };
  }
}
