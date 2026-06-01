import { Injectable, Logger } from '@nestjs/common';

export interface AddressFieldConfig {
  used: boolean;
  required: boolean;
  label: string;
  options?: { code: string; name: string }[];
  regex?: string | null;
}

export interface CountryAddressConfig {
  addressLines: AddressFieldConfig;
  locality: AddressFieldConfig;
  administrativeArea: AddressFieldConfig;
  postalCode: AddressFieldConfig;
}

@Injectable()
export class AddressConfigService {
  private readonly logger = new Logger(AddressConfigService.name);
  private cache = new Map<string, any>();
  private readonly baseUrl = 'https://chromium-i18n.appspot.com/ssl-address/data';

  // Fallback data for most common countries
  private fallbackData: Record<string, any> = {
    US: { fmt: '%N%n%O%n%A%n%C, %S %Z', require: 'ACSZ', zip_nameType: 'zip', state_nameType: 'state', sub_keys: 'AL~AK~AZ~AR~CA~CO~CT~DE~FL~GA~HI~ID~IL~IN~IA~KS~KY~LA~ME~MD~MA~MI~MN~MS~MO~MT~NE~NV~NH~NJ~NM~NY~NC~ND~OH~OK~OR~PA~RI~SC~SD~TN~TX~UT~VT~VA~WA~WV~WI~WY', zip: '[0-9]{5}(?:[- ][0-9]{4})?' },
    CA: { fmt: '%N%n%O%n%A%n%C %S %Z', require: 'ACSZ', zip_nameType: 'postal', state_nameType: 'province', sub_keys: 'AB~BC~MB~NB~NL~NT~NS~NU~ON~PE~QC~SK~YT', zip: '[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ] ?[0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]' },
    GB: { fmt: '%N%n%O%n%A%n%C%n%Z', require: 'ACZ', zip_nameType: 'postal', state_nameType: 'county', zip: 'GIR ?0AA|(?:(?:AB|AL|B|BA|BB|BD|BH|BL|BN|BR|BS|BT|BX|CA|CB|CF|CH|CM|CO|CR|CT|CV|CW|DA|DD|DE|DG|DH|DL|DN|DT|DY|E|EC|EH|EN|EX|FK|FY|G|GL|GY|GU|HA|HD|HG|HP|HR|HS|HU|HX|IG|IM|IP|IV|JE|KA|KT|KW|KY|L|LA|LD|LE|LL|LN|LS|LU|M|ME|MK|ML|N|NE|NG|NN|NP|NR|NW|OL|OX|PA|PE|PH|PL|PO|PR|RG|RH|RM|S|SA|SE|SG|SK|SL|SM|SN|SO|SP|SR|SS|ST|SW|SY|TA|TD|TF|TN|TQ|TR|TS|TW|UB|W|WA|WC|WD|WF|WN|WR|WS|WV|YO|ZE)(?:[0-9][0-9A-Z]? ?[0-9][ABD-HJLN-UW-Z]{2}))|BFPO ?[0-9]{1,4}' },
    AU: { fmt: '%O%n%N%n%A%n%C %S %Z', require: 'ACSZ', zip_nameType: 'postal', state_nameType: 'state', sub_keys: 'ACT~NSW~NT~QLD~SA~TAS~VIC~WA', zip: '[0-9]{4}' },
    IN: { fmt: '%N%n%O%n%A%n%C %Z%n%S', require: 'ACSZ', zip_nameType: 'postal', state_nameType: 'state', sub_keys: 'AN~AP~AR~AS~BR~CG~CH~DD~DL~DN~GA~GJ~HP~HR~JH~JK~KA~KL~LA~LD~MH~ML~MN~MP~MZ~NL~OR~PB~PY~RJ~SK~TN~TR~TS~UK~UP~WB', zip: '[1-9][0-9]{5}' },
    PK: { fmt: '%N%n%O%n%A%n%C%n%Z', require: 'AC', zip_nameType: 'postal', state_nameType: 'state', zip: '[0-9]{5}' },
    AE: { fmt: '%N%n%O%n%A%n%S', require: 'AS', zip_nameType: 'postal', state_nameType: 'emirate', sub_keys: 'AZ~AJ~DU~FU~RK~SH~UQ' },
    DE: { fmt: '%N%n%O%n%A%n%Z %C', require: 'ACZ', zip_nameType: 'postal', state_nameType: 'state', zip: '[0-9]{5}' },
    FR: { fmt: '%O%n%N%n%A%n%Z %C', require: 'ACZ', zip_nameType: 'postal', state_nameType: 'province', zip: '[0-9]{5}' },
    BR: { fmt: '%O%n%N%n%A%n%C-%S%n%Z', require: 'ACSZ', zip_nameType: 'postal', state_nameType: 'state', sub_keys: 'AC~AL~AM~AP~BA~CE~DF~ES~GO~MA~MG~MS~MT~PA~PB~PE~PI~PR~RJ~RN~RO~RR~RS~SC~SE~SP~TO', zip: '[0-9]{5}-?[0-9]{3}' },
    SG: { fmt: '%N%n%O%n%A%n%Z', require: 'AZ', zip_nameType: 'postal', zip: '[0-9]{6}' },
    NZ: { fmt: '%N%n%O%n%A%n%D%n%C %Z', require: 'ACZ', zip_nameType: 'postal', zip: '[0-9]{4}' },
    ZA: { fmt: '%N%n%O%n%A%n%D%n%C%n%Z', require: 'ACZ', zip_nameType: 'postal', zip: '[0-9]{4}' },
  };

  async getCountries(): Promise<{ code: string; name: string }[]> {
    const COUNTRIES = [
      { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
      { code: 'AR', name: 'Argentina' }, { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' },
      { code: 'AZ', name: 'Azerbaijan' }, { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' },
      { code: 'BE', name: 'Belgium' }, { code: 'BZ', name: 'Belize' }, { code: 'BR', name: 'Brazil' },
      { code: 'CA', name: 'Canada' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
      { code: 'CO', name: 'Colombia' }, { code: 'HR', name: 'Croatia' }, { code: 'CY', name: 'Cyprus' },
      { code: 'CZ', name: 'Czech Republic' }, { code: 'DK', name: 'Denmark' }, { code: 'EG', name: 'Egypt' },
      { code: 'EE', name: 'Estonia' }, { code: 'ET', name: 'Ethiopia' }, { code: 'FI', name: 'Finland' },
      { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' },
      { code: 'GR', name: 'Greece' }, { code: 'HK', name: 'Hong Kong' }, { code: 'HU', name: 'Hungary' },
      { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' }, { code: 'IQ', name: 'Iraq' },
      { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Italy' },
      { code: 'JP', name: 'Japan' }, { code: 'JO', name: 'Jordan' }, { code: 'KZ', name: 'Kazakhstan' },
      { code: 'KE', name: 'Kenya' }, { code: 'KW', name: 'Kuwait' }, { code: 'LB', name: 'Lebanon' },
      { code: 'LY', name: 'Libya' }, { code: 'LU', name: 'Luxembourg' }, { code: 'MY', name: 'Malaysia' },
      { code: 'MV', name: 'Maldives' }, { code: 'MX', name: 'Mexico' }, { code: 'MA', name: 'Morocco' },
      { code: 'MM', name: 'Myanmar' }, { code: 'NP', name: 'Nepal' }, { code: 'NL', name: 'Netherlands' },
      { code: 'NZ', name: 'New Zealand' }, { code: 'NG', name: 'Nigeria' }, { code: 'NO', name: 'Norway' },
      { code: 'OM', name: 'Oman' }, { code: 'PK', name: 'Pakistan' }, { code: 'PS', name: 'Palestine' },
      { code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' }, { code: 'PL', name: 'Poland' },
      { code: 'PT', name: 'Portugal' }, { code: 'QA', name: 'Qatar' }, { code: 'RO', name: 'Romania' },
      { code: 'RU', name: 'Russia' }, { code: 'SA', name: 'Saudi Arabia' }, { code: 'SN', name: 'Senegal' },
      { code: 'RS', name: 'Serbia' }, { code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' },
      { code: 'ZA', name: 'South Africa' }, { code: 'KR', name: 'South Korea' }, { code: 'ES', name: 'Spain' },
      { code: 'LK', name: 'Sri Lanka' }, { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' },
      { code: 'SY', name: 'Syria' }, { code: 'TW', name: 'Taiwan' }, { code: 'TZ', name: 'Tanzania' },
      { code: 'TH', name: 'Thailand' }, { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' },
      { code: 'UG', name: 'Uganda' }, { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'United Arab Emirates' },
      { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' },
      { code: 'UZ', name: 'Uzbekistan' }, { code: 'VN', name: 'Vietnam' }, { code: 'YE', name: 'Yemen' },
      { code: 'ZW', name: 'Zimbabwe' },
    ];
    return COUNTRIES.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getConfig(countryCode: string): Promise<CountryAddressConfig> {
    const key = `config_${countryCode}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    try {
      const response = await fetch(`${this.baseUrl}/${countryCode}`);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      const config = this.parseConfig(data);
      this.cache.set(key, config);
      return config;
    } catch (e) {
      this.logger.warn(`External address config failed for ${countryCode}, using fallback`);
      const fallback = this.fallbackData[countryCode] || {};
      const config = this.parseConfig(fallback);
      this.cache.set(key, config);
      return config;
    }
  }

  async validatePostalCode(countryCode: string, postalCode: string): Promise<boolean> {
    if (!postalCode) return true;
    const config = await this.getConfig(countryCode);
    const regexStr = config.postalCode?.regex;
    if (!regexStr) return true;
    try {
      const regex = new RegExp(`^(${regexStr})$`, 'i');
      return regex.test(postalCode);
    } catch {
      return true;
    }
  }

  private parseConfig(data: any): CountryAddressConfig {
    const requiredStr = data.require || 'A';
    const formatStr = data.fmt || '%N%n%O%n%A%n%C%n%Z';

    const hasField = (token: string) => formatStr.includes(token);
    const isRequired = (token: string) => requiredStr.includes(token);

    let states: { code: string; name: string }[] = [];
    if (data.sub_keys) {
      const keys = (data.sub_keys as string).split('~');
      const names = data.sub_names ? (data.sub_names as string).split('~') : keys;
      states = keys.map((k: string, i: number) => ({ code: k, name: names[i] || k }));
    }

    return {
      addressLines: {
        used: true, // Always show street address
        required: true, // Always required
        label: 'Street Address',
      },
      locality: {
        used: hasField('%C'),
        required: isRequired('C'),
        label: data.locality_nameType === 'post_town' ? 'Town/City' : data.locality_nameType === 'district' ? 'District' : 'City',
      },
      administrativeArea: {
        used: hasField('%S'),
        required: isRequired('S'),
        label: data.state_nameType === 'province' ? 'Province' : data.state_nameType === 'emirate' ? 'Emirate' : data.state_nameType === 'county' ? 'County' : 'State',
        options: states,
      },
      postalCode: {
        used: hasField('%Z'),
        required: isRequired('Z'),
        label: data.zip_nameType === 'zip' ? 'ZIP Code' : 'Postal Code',
        regex: data.zip || null,
      },
    };
  }
}
