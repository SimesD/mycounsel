// Companies House API integration

export interface CompaniesHouseResult {
    company_number: string;
    title: string;
    registered_office_address?: {
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

async function fetchCompanies(
    name: string,
    apiKey: string,
    limit: number,
): Promise<CompaniesHouseResult[]> {
    const encoded = encodeURIComponent(name);
    const credentials = btoa(`${apiKey}:`);

    const response = await fetch(
        `https://api.company-information.service.gov.uk/search/companies?q=${encoded}&items_per_page=${limit}`,
        {
            headers: {
                Authorization: `Basic ${credentials}`,
                "Content-Type": "application/json",
            },
        },
    );

    if (!response.ok) {
        console.error(
            `Companies House API error: ${response.status} ${response.statusText}`,
        );
        return [];
    }

    const data = (await response.json()) as CompaniesHouseSearchResponse;
    return data.items ?? [];
}

/** Returns the single best match — used internally by the intake agent. */
export async function searchCompany(
    name: string,
    apiKey: string,
): Promise<CompaniesHouseResult | null> {
    const items = await fetchCompanies(name, apiKey, 5);
    return items[0] ?? null;
}

/** Returns up to `limit` matches — used by the /companies-house/search endpoint. */
export async function searchCompanies(
    name: string,
    apiKey: string,
    limit = 5,
): Promise<CompaniesHouseResult[]> {
    return fetchCompanies(name, apiKey, limit);
}

export function formatAddress(result: CompaniesHouseResult): string {
    const addr = result.registered_office_address ?? {};
    return [
        addr.address_line_1,
        addr.address_line_2,
        addr.locality,
        addr.postal_code,
        addr.country ?? "England",
    ]
        .filter(Boolean)
        .join(", ");
}
