// Companies House API integration

export interface CompaniesHouseResult {
  company_number: string;
  title: string;
  registered_office_address: {
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    postal_code?: string;
    country?: string;
  };
  company_status: string;
  company_type: string;
}

export interface CompaniesHouseSearchResponse {
  items: CompaniesHouseResult[];
  total_results: number;
}

export async function searchCompany(
  name: string,
  apiKey: string
): Promise<CompaniesHouseResult | null> {
  const encoded = encodeURIComponent(name);
  const credentials = btoa(`${apiKey}:`);

  const response = await fetch(
    `https://api.company-information.service.gov.uk/search/companies?q=${encoded}&items_per_page=5`,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    console.error(
      `Companies House API error: ${response.status} ${response.statusText}`
    );
    return null;
  }

  const data = (await response.json()) as CompaniesHouseSearchResponse;

  if (!data.items || data.items.length === 0) return null;

  // Return best match (first result)
  return data.items[0];
}

export function formatAddress(result: CompaniesHouseResult): string {
  const addr = result.registered_office_address;
  return [
    addr.address_line_1,
    addr.address_line_2,
    addr.locality,
    addr.postal_code,
    addr.country ?? 'England',
  ]
    .filter(Boolean)
    .join(', ');
}
