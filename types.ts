
export interface Template {
    file: File;
    url: string;
    type: string; // e.g., 'application/pdf', 'image/jpeg'
    width: number;
    height: number;
}

export interface Placeholder {
    id: string;
    name: string;
    x: number;
    y: number;
    fontSize: number;
    color: { r: number; g: number; b: number; };
}

export type CsvData = Record<string, string>;
