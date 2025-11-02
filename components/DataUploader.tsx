
import React, { useState, useCallback } from 'react';
import { CsvData } from '../types';
import { UploadIcon } from './icons';

// Make Papa accessible from the window object
declare const Papa: any;

interface DataUploaderProps {
    onDataUpload: (data: CsvData[]) => void;
    placeholderNames: string[];
}

const DataUploader: React.FC<DataUploaderProps> = ({ onDataUpload, placeholderNames }) => {
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        setIsProcessing(true);
        setError(null);
        setFileName(file.name);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
                const headers = results.meta.fields;
                const missingHeaders = placeholderNames.filter(pName => !headers.includes(pName));

                if (missingHeaders.length > 0) {
                    setError(`CSV file is missing required columns: ${missingHeaders.join(', ')}`);
                    setFileName(null);
                } else if (!results.data || results.data.length === 0) {
                    setError('CSV file is empty or invalid.');
                    setFileName(null);
                }
                else {
                    onDataUpload(results.data);
                }
                setIsProcessing(false);
            },
            error: (err: any) => {
                setError(`Failed to parse CSV: ${err.message}`);
                setIsProcessing(false);
                setFileName(null);
            }
        });

    }, [onDataUpload, placeholderNames]);
    
    return (
        <div className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4 text-cyan-400">Step 3: Upload Your Data</h2>
            <p className="text-slate-400 mb-2 max-w-2xl mx-auto">Upload a CSV file with the data for your documents.</p>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                The first row must be a header row with column names matching the fields you created:
                <code className="block bg-slate-900 text-cyan-300 p-2 rounded-md mt-2 text-sm break-words">{placeholderNames.join(', ')}</code>
            </p>
            
            <div className="flex items-center justify-center w-full">
                 <label htmlFor="csv-file-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadIcon className="w-10 h-10 mb-3 text-slate-400"/>
                        {fileName ? (
                             <p className="font-semibold text-green-400">{fileName}</p>
                        ) : (
                             <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop</p>
                        )}
                       <p className="text-xs text-slate-500">CSV file</p>
                    </div>
                    <input id="csv-file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".csv" disabled={isProcessing} />
                </label>
            </div>
            {isProcessing && <p className="mt-4 text-cyan-400">Parsing file...</p>}
            {error && <p className="mt-4 text-red-400 p-3 bg-red-900/50 border border-red-800 rounded-md">{error}</p>}
        </div>
    );
};

export default DataUploader;
