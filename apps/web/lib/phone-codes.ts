export type DialCodeOption = { country: string; code: string; dialCode: string };

/** Remove duplicate dial codes / country codes for phone dropdowns. */
export function dedupeDialCodes(options: DialCodeOption[]): DialCodeOption[] {
    const byCode = new Map<string, DialCodeOption>();
    for (const opt of options) {
        const iso = (opt.code || '').trim().toUpperCase();
        if (!iso || byCode.has(iso)) continue;
        byCode.set(iso, opt);
    }
    return Array.from(byCode.values()).sort((a, b) => a.country.localeCompare(b.country));
}

export const DEFAULT_DIAL_CODES: DialCodeOption[] = dedupeDialCodes([
    {
        "country": "Aruba",
        "code": "AW",
        "dialCode": "+297"
    },
    {
        "country": "Afghanistan",
        "code": "AF",
        "dialCode": "+93"
    },
    {
        "country": "Angola",
        "code": "AO",
        "dialCode": "+244"
    },
    {
        "country": "Anguilla",
        "code": "AI",
        "dialCode": "+1264"
    },
    {
        "country": "Åland Islands",
        "code": "AX",
        "dialCode": "+35818"
    },
    {
        "country": "Albania",
        "code": "AL",
        "dialCode": "+355"
    },
    {
        "country": "Andorra",
        "code": "AD",
        "dialCode": "+376"
    },
    {
        "country": "United Arab Emirates",
        "code": "AE",
        "dialCode": "+971"
    },
    {
        "country": "Argentina",
        "code": "AR",
        "dialCode": "+54"
    },
    {
        "country": "Armenia",
        "code": "AM",
        "dialCode": "+374"
    },
    {
        "country": "American Samoa",
        "code": "AS",
        "dialCode": "+1684"
    },
    {
        "country": "French Southern and Antarctic Lands",
        "code": "TF",
        "dialCode": "+262"
    },
    {
        "country": "Antigua and Barbuda",
        "code": "AG",
        "dialCode": "+1268"
    },
    {
        "country": "Australia",
        "code": "AU",
        "dialCode": "+61"
    },
    {
        "country": "Austria",
        "code": "AT",
        "dialCode": "+43"
    },
    {
        "country": "Azerbaijan",
        "code": "AZ",
        "dialCode": "+994"
    },
    {
        "country": "Burundi",
        "code": "BI",
        "dialCode": "+257"
    },
    {
        "country": "Belgium",
        "code": "BE",
        "dialCode": "+32"
    },
    {
        "country": "Benin",
        "code": "BJ",
        "dialCode": "+229"
    },
    {
        "country": "Burkina Faso",
        "code": "BF",
        "dialCode": "+226"
    },
    {
        "country": "Bangladesh",
        "code": "BD",
        "dialCode": "+880"
    },
    {
        "country": "Bulgaria",
        "code": "BG",
        "dialCode": "+359"
    },
    {
        "country": "Bahrain",
        "code": "BH",
        "dialCode": "+973"
    },
    {
        "country": "Bahamas",
        "code": "BS",
        "dialCode": "+1242"
    },
    {
        "country": "Bosnia and Herzegovina",
        "code": "BA",
        "dialCode": "+387"
    },
    {
        "country": "Saint Barthélemy",
        "code": "BL",
        "dialCode": "+590"
    },
    {
        "country": "Saint Helena, Ascension and Tristan da Cunha",
        "code": "SH",
        "dialCode": "+2"
    },
    {
        "country": "Belarus",
        "code": "BY",
        "dialCode": "+375"
    },
    {
        "country": "Belize",
        "code": "BZ",
        "dialCode": "+501"
    },
    {
        "country": "Bermuda",
        "code": "BM",
        "dialCode": "+1441"
    },
    {
        "country": "Bolivia",
        "code": "BO",
        "dialCode": "+591"
    },
    {
        "country": "Caribbean Netherlands",
        "code": "BQ",
        "dialCode": "+599"
    },
    {
        "country": "Brazil",
        "code": "BR",
        "dialCode": "+55"
    },
    {
        "country": "Barbados",
        "code": "BB",
        "dialCode": "+1246"
    },
    {
        "country": "Brunei",
        "code": "BN",
        "dialCode": "+673"
    },
    {
        "country": "Bhutan",
        "code": "BT",
        "dialCode": "+975"
    },
    {
        "country": "Bouvet Island",
        "code": "BV",
        "dialCode": "+47"
    },
    {
        "country": "Botswana",
        "code": "BW",
        "dialCode": "+267"
    },
    {
        "country": "Central African Republic",
        "code": "CF",
        "dialCode": "+236"
    },
    {
        "country": "Canada",
        "code": "CA",
        "dialCode": "+1"
    },
    {
        "country": "Cocos (Keeling) Islands",
        "code": "CC",
        "dialCode": "+61"
    },
    {
        "country": "Switzerland",
        "code": "CH",
        "dialCode": "+41"
    },
    {
        "country": "Chile",
        "code": "CL",
        "dialCode": "+56"
    },
    {
        "country": "China",
        "code": "CN",
        "dialCode": "+86"
    },
    {
        "country": "Ivory Coast",
        "code": "CI",
        "dialCode": "+225"
    },
    {
        "country": "Cameroon",
        "code": "CM",
        "dialCode": "+237"
    },
    {
        "country": "DR Congo",
        "code": "CD",
        "dialCode": "+243"
    },
    {
        "country": "Congo",
        "code": "CG",
        "dialCode": "+242"
    },
    {
        "country": "Cook Islands",
        "code": "CK",
        "dialCode": "+682"
    },
    {
        "country": "Colombia",
        "code": "CO",
        "dialCode": "+57"
    },
    {
        "country": "Comoros",
        "code": "KM",
        "dialCode": "+269"
    },
    {
        "country": "Cape Verde",
        "code": "CV",
        "dialCode": "+238"
    },
    {
        "country": "Costa Rica",
        "code": "CR",
        "dialCode": "+506"
    },
    {
        "country": "Cuba",
        "code": "CU",
        "dialCode": "+53"
    },
    {
        "country": "Curaçao",
        "code": "CW",
        "dialCode": "+599"
    },
    {
        "country": "Christmas Island",
        "code": "CX",
        "dialCode": "+61"
    },
    {
        "country": "Cayman Islands",
        "code": "KY",
        "dialCode": "+1345"
    },
    {
        "country": "Cyprus",
        "code": "CY",
        "dialCode": "+357"
    },
    {
        "country": "Czechia",
        "code": "CZ",
        "dialCode": "+420"
    },
    {
        "country": "Germany",
        "code": "DE",
        "dialCode": "+49"
    },
    {
        "country": "Djibouti",
        "code": "DJ",
        "dialCode": "+253"
    },
    {
        "country": "Dominica",
        "code": "DM",
        "dialCode": "+1767"
    },
    {
        "country": "Denmark",
        "code": "DK",
        "dialCode": "+45"
    },
    {
        "country": "Dominican Republic",
        "code": "DO",
        "dialCode": "+1"
    },
    {
        "country": "Algeria",
        "code": "DZ",
        "dialCode": "+213"
    },
    {
        "country": "Ecuador",
        "code": "EC",
        "dialCode": "+593"
    },
    {
        "country": "Egypt",
        "code": "EG",
        "dialCode": "+20"
    },
    {
        "country": "Eritrea",
        "code": "ER",
        "dialCode": "+291"
    },
    {
        "country": "Western Sahara",
        "code": "EH",
        "dialCode": "+2"
    },
    {
        "country": "Spain",
        "code": "ES",
        "dialCode": "+34"
    },
    {
        "country": "Estonia",
        "code": "EE",
        "dialCode": "+372"
    },
    {
        "country": "Ethiopia",
        "code": "ET",
        "dialCode": "+251"
    },
    {
        "country": "Finland",
        "code": "FI",
        "dialCode": "+358"
    },
    {
        "country": "Fiji",
        "code": "FJ",
        "dialCode": "+679"
    },
    {
        "country": "Falkland Islands",
        "code": "FK",
        "dialCode": "+500"
    },
    {
        "country": "France",
        "code": "FR",
        "dialCode": "+33"
    },
    {
        "country": "Faroe Islands",
        "code": "FO",
        "dialCode": "+298"
    },
    {
        "country": "Micronesia",
        "code": "FM",
        "dialCode": "+691"
    },
    {
        "country": "Gabon",
        "code": "GA",
        "dialCode": "+241"
    },
    {
        "country": "United Kingdom",
        "code": "GB",
        "dialCode": "+44"
    },
    {
        "country": "Georgia",
        "code": "GE",
        "dialCode": "+995"
    },
    {
        "country": "Guernsey",
        "code": "GG",
        "dialCode": "+44"
    },
    {
        "country": "Ghana",
        "code": "GH",
        "dialCode": "+233"
    },
    {
        "country": "Gibraltar",
        "code": "GI",
        "dialCode": "+350"
    },
    {
        "country": "Guinea",
        "code": "GN",
        "dialCode": "+224"
    },
    {
        "country": "Guadeloupe",
        "code": "GP",
        "dialCode": "+590"
    },
    {
        "country": "Gambia",
        "code": "GM",
        "dialCode": "+220"
    },
    {
        "country": "Guinea-Bissau",
        "code": "GW",
        "dialCode": "+245"
    },
    {
        "country": "Equatorial Guinea",
        "code": "GQ",
        "dialCode": "+240"
    },
    {
        "country": "Greece",
        "code": "GR",
        "dialCode": "+30"
    },
    {
        "country": "Grenada",
        "code": "GD",
        "dialCode": "+1473"
    },
    {
        "country": "Greenland",
        "code": "GL",
        "dialCode": "+299"
    },
    {
        "country": "Guatemala",
        "code": "GT",
        "dialCode": "+502"
    },
    {
        "country": "French Guiana",
        "code": "GF",
        "dialCode": "+594"
    },
    {
        "country": "Guam",
        "code": "GU",
        "dialCode": "+1671"
    },
    {
        "country": "Guyana",
        "code": "GY",
        "dialCode": "+592"
    },
    {
        "country": "Hong Kong",
        "code": "HK",
        "dialCode": "+852"
    },
    {
        "country": "Honduras",
        "code": "HN",
        "dialCode": "+504"
    },
    {
        "country": "Croatia",
        "code": "HR",
        "dialCode": "+385"
    },
    {
        "country": "Haiti",
        "code": "HT",
        "dialCode": "+509"
    },
    {
        "country": "Hungary",
        "code": "HU",
        "dialCode": "+36"
    },
    {
        "country": "Indonesia",
        "code": "ID",
        "dialCode": "+62"
    },
    {
        "country": "Isle of Man",
        "code": "IM",
        "dialCode": "+44"
    },
    {
        "country": "India",
        "code": "IN",
        "dialCode": "+91"
    },
    {
        "country": "British Indian Ocean Territory",
        "code": "IO",
        "dialCode": "+246"
    },
    {
        "country": "Ireland",
        "code": "IE",
        "dialCode": "+353"
    },
    {
        "country": "Iran",
        "code": "IR",
        "dialCode": "+98"
    },
    {
        "country": "Iraq",
        "code": "IQ",
        "dialCode": "+964"
    },
    {
        "country": "Iceland",
        "code": "IS",
        "dialCode": "+354"
    },
    {
        "country": "Israel",
        "code": "IL",
        "dialCode": "+972"
    },
    {
        "country": "Italy",
        "code": "IT",
        "dialCode": "+39"
    },
    {
        "country": "Jamaica",
        "code": "JM",
        "dialCode": "+1876"
    },
    {
        "country": "Jersey",
        "code": "JE",
        "dialCode": "+44"
    },
    {
        "country": "Jordan",
        "code": "JO",
        "dialCode": "+962"
    },
    {
        "country": "Japan",
        "code": "JP",
        "dialCode": "+81"
    },
    {
        "country": "Kazakhstan",
        "code": "KZ",
        "dialCode": "+7"
    },
    {
        "country": "Kenya",
        "code": "KE",
        "dialCode": "+254"
    },
    {
        "country": "Kyrgyzstan",
        "code": "KG",
        "dialCode": "+996"
    },
    {
        "country": "Cambodia",
        "code": "KH",
        "dialCode": "+855"
    },
    {
        "country": "Kiribati",
        "code": "KI",
        "dialCode": "+686"
    },
    {
        "country": "Saint Kitts and Nevis",
        "code": "KN",
        "dialCode": "+1869"
    },
    {
        "country": "South Korea",
        "code": "KR",
        "dialCode": "+82"
    },
    {
        "country": "Kosovo",
        "code": "XK",
        "dialCode": "+383"
    },
    {
        "country": "Kuwait",
        "code": "KW",
        "dialCode": "+965"
    },
    {
        "country": "Laos",
        "code": "LA",
        "dialCode": "+856"
    },
    {
        "country": "Lebanon",
        "code": "LB",
        "dialCode": "+961"
    },
    {
        "country": "Liberia",
        "code": "LR",
        "dialCode": "+231"
    },
    {
        "country": "Libya",
        "code": "LY",
        "dialCode": "+218"
    },
    {
        "country": "Saint Lucia",
        "code": "LC",
        "dialCode": "+1758"
    },
    {
        "country": "Liechtenstein",
        "code": "LI",
        "dialCode": "+423"
    },
    {
        "country": "Sri Lanka",
        "code": "LK",
        "dialCode": "+94"
    },
    {
        "country": "Lesotho",
        "code": "LS",
        "dialCode": "+266"
    },
    {
        "country": "Lithuania",
        "code": "LT",
        "dialCode": "+370"
    },
    {
        "country": "Luxembourg",
        "code": "LU",
        "dialCode": "+352"
    },
    {
        "country": "Latvia",
        "code": "LV",
        "dialCode": "+371"
    },
    {
        "country": "Macau",
        "code": "MO",
        "dialCode": "+853"
    },
    {
        "country": "Saint Martin",
        "code": "MF",
        "dialCode": "+590"
    },
    {
        "country": "Morocco",
        "code": "MA",
        "dialCode": "+212"
    },
    {
        "country": "Monaco",
        "code": "MC",
        "dialCode": "+377"
    },
    {
        "country": "Moldova",
        "code": "MD",
        "dialCode": "+373"
    },
    {
        "country": "Madagascar",
        "code": "MG",
        "dialCode": "+261"
    },
    {
        "country": "Maldives",
        "code": "MV",
        "dialCode": "+960"
    },
    {
        "country": "Mexico",
        "code": "MX",
        "dialCode": "+52"
    },
    {
        "country": "Marshall Islands",
        "code": "MH",
        "dialCode": "+692"
    },
    {
        "country": "North Macedonia",
        "code": "MK",
        "dialCode": "+389"
    },
    {
        "country": "Mali",
        "code": "ML",
        "dialCode": "+223"
    },
    {
        "country": "Malta",
        "code": "MT",
        "dialCode": "+356"
    },
    {
        "country": "Myanmar",
        "code": "MM",
        "dialCode": "+95"
    },
    {
        "country": "Montenegro",
        "code": "ME",
        "dialCode": "+382"
    },
    {
        "country": "Mongolia",
        "code": "MN",
        "dialCode": "+976"
    },
    {
        "country": "Northern Mariana Islands",
        "code": "MP",
        "dialCode": "+1670"
    },
    {
        "country": "Mozambique",
        "code": "MZ",
        "dialCode": "+258"
    },
    {
        "country": "Mauritania",
        "code": "MR",
        "dialCode": "+222"
    },
    {
        "country": "Montserrat",
        "code": "MS",
        "dialCode": "+1664"
    },
    {
        "country": "Martinique",
        "code": "MQ",
        "dialCode": "+596"
    },
    {
        "country": "Mauritius",
        "code": "MU",
        "dialCode": "+230"
    },
    {
        "country": "Malawi",
        "code": "MW",
        "dialCode": "+265"
    },
    {
        "country": "Malaysia",
        "code": "MY",
        "dialCode": "+60"
    },
    {
        "country": "Mayotte",
        "code": "YT",
        "dialCode": "+262"
    },
    {
        "country": "Namibia",
        "code": "NA",
        "dialCode": "+264"
    },
    {
        "country": "New Caledonia",
        "code": "NC",
        "dialCode": "+687"
    },
    {
        "country": "Niger",
        "code": "NE",
        "dialCode": "+227"
    },
    {
        "country": "Norfolk Island",
        "code": "NF",
        "dialCode": "+672"
    },
    {
        "country": "Nigeria",
        "code": "NG",
        "dialCode": "+234"
    },
    {
        "country": "Nicaragua",
        "code": "NI",
        "dialCode": "+505"
    },
    {
        "country": "Niue",
        "code": "NU",
        "dialCode": "+683"
    },
    {
        "country": "Netherlands",
        "code": "NL",
        "dialCode": "+31"
    },
    {
        "country": "Norway",
        "code": "NO",
        "dialCode": "+47"
    },
    {
        "country": "Nepal",
        "code": "NP",
        "dialCode": "+977"
    },
    {
        "country": "Nauru",
        "code": "NR",
        "dialCode": "+674"
    },
    {
        "country": "New Zealand",
        "code": "NZ",
        "dialCode": "+64"
    },
    {
        "country": "Oman",
        "code": "OM",
        "dialCode": "+968"
    },
    {
        "country": "Pakistan",
        "code": "PK",
        "dialCode": "+92"
    },
    {
        "country": "Panama",
        "code": "PA",
        "dialCode": "+507"
    },
    {
        "country": "Pitcairn Islands",
        "code": "PN",
        "dialCode": "+64"
    },
    {
        "country": "Peru",
        "code": "PE",
        "dialCode": "+51"
    },
    {
        "country": "Philippines",
        "code": "PH",
        "dialCode": "+63"
    },
    {
        "country": "Palau",
        "code": "PW",
        "dialCode": "+680"
    },
    {
        "country": "Papua New Guinea",
        "code": "PG",
        "dialCode": "+675"
    },
    {
        "country": "Poland",
        "code": "PL",
        "dialCode": "+48"
    },
    {
        "country": "Puerto Rico",
        "code": "PR",
        "dialCode": "+1"
    },
    {
        "country": "North Korea",
        "code": "KP",
        "dialCode": "+850"
    },
    {
        "country": "Portugal",
        "code": "PT",
        "dialCode": "+351"
    },
    {
        "country": "Paraguay",
        "code": "PY",
        "dialCode": "+595"
    },
    {
        "country": "Palestine",
        "code": "PS",
        "dialCode": "+970"
    },
    {
        "country": "French Polynesia",
        "code": "PF",
        "dialCode": "+689"
    },
    {
        "country": "Qatar",
        "code": "QA",
        "dialCode": "+974"
    },
    {
        "country": "Réunion",
        "code": "RE",
        "dialCode": "+262"
    },
    {
        "country": "Romania",
        "code": "RO",
        "dialCode": "+40"
    },
    {
        "country": "Russia",
        "code": "RU",
        "dialCode": "+7"
    },
    {
        "country": "Rwanda",
        "code": "RW",
        "dialCode": "+250"
    },
    {
        "country": "Saudi Arabia",
        "code": "SA",
        "dialCode": "+966"
    },
    {
        "country": "Sudan",
        "code": "SD",
        "dialCode": "+249"
    },
    {
        "country": "Senegal",
        "code": "SN",
        "dialCode": "+221"
    },
    {
        "country": "Singapore",
        "code": "SG",
        "dialCode": "+65"
    },
    {
        "country": "South Georgia",
        "code": "GS",
        "dialCode": "+500"
    },
    {
        "country": "Svalbard and Jan Mayen",
        "code": "SJ",
        "dialCode": "+4779"
    },
    {
        "country": "Solomon Islands",
        "code": "SB",
        "dialCode": "+677"
    },
    {
        "country": "Sierra Leone",
        "code": "SL",
        "dialCode": "+232"
    },
    {
        "country": "El Salvador",
        "code": "SV",
        "dialCode": "+503"
    },
    {
        "country": "San Marino",
        "code": "SM",
        "dialCode": "+378"
    },
    {
        "country": "Somalia",
        "code": "SO",
        "dialCode": "+252"
    },
    {
        "country": "Saint Pierre and Miquelon",
        "code": "PM",
        "dialCode": "+508"
    },
    {
        "country": "Serbia",
        "code": "RS",
        "dialCode": "+381"
    },
    {
        "country": "South Sudan",
        "code": "SS",
        "dialCode": "+211"
    },
    {
        "country": "São Tomé and Príncipe",
        "code": "ST",
        "dialCode": "+239"
    },
    {
        "country": "Suriname",
        "code": "SR",
        "dialCode": "+597"
    },
    {
        "country": "Slovakia",
        "code": "SK",
        "dialCode": "+421"
    },
    {
        "country": "Slovenia",
        "code": "SI",
        "dialCode": "+386"
    },
    {
        "country": "Sweden",
        "code": "SE",
        "dialCode": "+46"
    },
    {
        "country": "Eswatini",
        "code": "SZ",
        "dialCode": "+268"
    },
    {
        "country": "Sint Maarten",
        "code": "SX",
        "dialCode": "+1721"
    },
    {
        "country": "Seychelles",
        "code": "SC",
        "dialCode": "+248"
    },
    {
        "country": "Syria",
        "code": "SY",
        "dialCode": "+963"
    },
    {
        "country": "Turks and Caicos Islands",
        "code": "TC",
        "dialCode": "+1649"
    },
    {
        "country": "Chad",
        "code": "TD",
        "dialCode": "+235"
    },
    {
        "country": "Togo",
        "code": "TG",
        "dialCode": "+228"
    },
    {
        "country": "Thailand",
        "code": "TH",
        "dialCode": "+66"
    },
    {
        "country": "Tajikistan",
        "code": "TJ",
        "dialCode": "+992"
    },
    {
        "country": "Tokelau",
        "code": "TK",
        "dialCode": "+690"
    },
    {
        "country": "Turkmenistan",
        "code": "TM",
        "dialCode": "+993"
    },
    {
        "country": "Timor-Leste",
        "code": "TL",
        "dialCode": "+670"
    },
    {
        "country": "Tonga",
        "code": "TO",
        "dialCode": "+676"
    },
    {
        "country": "Trinidad and Tobago",
        "code": "TT",
        "dialCode": "+1868"
    },
    {
        "country": "Tunisia",
        "code": "TN",
        "dialCode": "+216"
    },
    {
        "country": "Türkiye",
        "code": "TR",
        "dialCode": "+90"
    },
    {
        "country": "Tuvalu",
        "code": "TV",
        "dialCode": "+688"
    },
    {
        "country": "Taiwan",
        "code": "TW",
        "dialCode": "+886"
    },
    {
        "country": "Tanzania",
        "code": "TZ",
        "dialCode": "+255"
    },
    {
        "country": "Uganda",
        "code": "UG",
        "dialCode": "+256"
    },
    {
        "country": "Ukraine",
        "code": "UA",
        "dialCode": "+380"
    },
    {
        "country": "United States Minor Outlying Islands",
        "code": "UM",
        "dialCode": "+268"
    },
    {
        "country": "Uruguay",
        "code": "UY",
        "dialCode": "+598"
    },
    {
        "country": "United States",
        "code": "US",
        "dialCode": "+1"
    },
    {
        "country": "Uzbekistan",
        "code": "UZ",
        "dialCode": "+998"
    },
    {
        "country": "Vatican City",
        "code": "VA",
        "dialCode": "+3"
    },
    {
        "country": "Saint Vincent and the Grenadines",
        "code": "VC",
        "dialCode": "+1784"
    },
    {
        "country": "Venezuela",
        "code": "VE",
        "dialCode": "+58"
    },
    {
        "country": "British Virgin Islands",
        "code": "VG",
        "dialCode": "+1284"
    },
    {
        "country": "United States Virgin Islands",
        "code": "VI",
        "dialCode": "+1340"
    },
    {
        "country": "Vietnam",
        "code": "VN",
        "dialCode": "+84"
    },
    {
        "country": "Vanuatu",
        "code": "VU",
        "dialCode": "+678"
    },
    {
        "country": "Wallis and Futuna",
        "code": "WF",
        "dialCode": "+681"
    },
    {
        "country": "Samoa",
        "code": "WS",
        "dialCode": "+685"
    },
    {
        "country": "Yemen",
        "code": "YE",
        "dialCode": "+967"
    },
    {
        "country": "South Africa",
        "code": "ZA",
        "dialCode": "+27"
    },
    {
        "country": "Zambia",
        "code": "ZM",
        "dialCode": "+260"
    },
    {
        "country": "Zimbabwe",
        "code": "ZW",
        "dialCode": "+263"
    }
]);
