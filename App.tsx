
import React, { useState, useCallback } from 'react';
import { Placeholder, Template, CsvData } from './types';
import TemplateUploader from './components/TemplateUploader';
import PlaceholderEditor from './components/PlaceholderEditor';
import DataUploader from './components/DataUploader';
import StepIndicator from './components/StepIndicator';
import { CertificateIcon } from './components/icons';

// Make pdf-lib accessible from the window object
declare const PDFLib: any;

const App: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [template, setTemplate] = useState<Template | null>(null);
    const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
    const [csvData, setCsvData] = useState<CsvData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTemplateUpload = (uploadedTemplate: Template) => {
        setTemplate(uploadedTemplate);
        setCurrentStep(2);
    };

    const handlePlaceholdersSet = (finalPlaceholders: Placeholder[]) => {
        setPlaceholders(finalPlaceholders);
        setCurrentStep(3);
    };

    const handleDataUpload = (data: CsvData[]) => {
        setCsvData(data);
        setCurrentStep(4);
    };
    
    const handleReset = () => {
        setCurrentStep(1);
        setTemplate(null);
        setPlaceholders([]);
        setCsvData([]);
        setError(null);
        setIsLoading(false);
    };

    const generatePdf = useCallback(async () => {
        if (!template || placeholders.length === 0 || csvData.length === 0) {
            setError("Missing template, placeholders, or data.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { PDFDocument, rgb, StandardFonts } = PDFLib;
            const finalPdfDoc = await PDFDocument.create();
            const font = await finalPdfDoc.embedFont(StandardFonts.Helvetica);

            const fileBytes = await fetch(template.url).then(res => res.arrayBuffer());

            for (const record of csvData) {
                let page;
                if (template.type === 'application/pdf') {
                    const templatePdfDoc = await PDFDocument.load(fileBytes);
                    const [templatePage] = await finalPdfDoc.copyPages(templatePdfDoc, [0]);
                    page = finalPdfDoc.addPage(templatePage);
                } else {
                    const image = template.type.includes('png') 
                        ? await finalPdfDoc.embedPng(fileBytes) 
                        : await finalPdfDoc.embedJpg(fileBytes);
                    page = finalPdfDoc.addPage([image.width, image.height]);
                    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
                }

                const { width, height } = page.getSize();
                
                placeholders.forEach(p => {
                    const text = record[p.name] || '';
                    if (text) {
                       const textWidth = font.widthOfTextAtSize(text, p.fontSize);
                       const textHeight = font.heightAtSize(p.fontSize);

                        // pdf-lib y-coordinate is from the bottom, UI is from the top.
                        const y = height - p.y - textHeight / 1.5; // Adjustment for baseline

                        page.drawText(text, {
                            x: p.x,
                            y: y,
                            font: font,
                            size: p.fontSize,
                            color: rgb(p.color.r / 255, p.color.g / 255, p.color.b / 255),
                        });
                    }
                });
            }

            const pdfBytes = await finalPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'generated-certificates.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setCurrentStep(5);

        } catch (e) {
            console.error(e);
            setError("An error occurred during PDF generation. Please check your files and try again.");
        } finally {
            setIsLoading(false);
        }
    }, [template, placeholders, csvData]);


    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <TemplateUploader onTemplateUpload={handleTemplateUpload} />;
            case 2:
                if (!template) return null;
                return <PlaceholderEditor template={template} onConfirm={handlePlaceholdersSet} />;
            case 3:
                return <DataUploader onDataUpload={handleDataUpload} placeholderNames={placeholders.map(p => p.name)} />;
            case 4:
                return (
                    <div className="text-center p-8 bg-slate-800 rounded-lg shadow-xl">
                        <h2 className="text-3xl font-bold mb-4 text-cyan-400">Ready to Generate</h2>
                        <p className="mb-2 text-slate-300">Template: <span className="font-semibold text-white">{template?.file.name}</span></p>
                        <p className="mb-2 text-slate-300">Placeholders: <span className="font-semibold text-white">{placeholders.length} fields</span></p>
                        <p className="mb-6 text-slate-300">Data Records: <span className="font-semibold text-white">{csvData.length} entries</span></p>
                        {error && <p className="text-red-400 mb-4">{error}</p>}
                        <button
                            onClick={generatePdf}
                            disabled={isLoading}
                            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </>
                            ) : 'Generate & Download PDF'}
                        </button>
                    </div>
                );
            case 5:
                 return (
                    <div className="text-center p-8 bg-slate-800 rounded-lg shadow-xl animate-fade-in">
                        <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold mb-4 text-green-400">Success!</h2>
                        <p className="mb-6 text-slate-300">Your certificates have been generated and the download has started.</p>
                        <button
                            onClick={handleReset}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out"
                        >
                            Create More
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-6xl mx-auto">
                <header className="text-center mb-8">
                    <div className="flex justify-center items-center gap-4">
                        <CertificateIcon className="h-12 w-12 text-cyan-400"/>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
                            Bulk Certificate Generator
                        </h1>
                    </div>
                    <p className="mt-4 text-lg text-slate-400">Create personalized documents in three easy steps.</p>
                </header>
                
                <main>
                    <StepIndicator currentStep={currentStep} onStepClick={setCurrentStep} />
                    <div className="mt-8 p-4 bg-slate-800/50 rounded-xl shadow-2xl border border-slate-700">
                        {renderStep()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
