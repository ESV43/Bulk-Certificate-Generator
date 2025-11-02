
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Template, Placeholder } from '../types';
import { AddIcon, DeleteIcon, EditIcon } from './icons';

// Make pdfjsLib accessible from the window object
declare const pdfjsLib: any;

interface PlaceholderEditorProps {
    template: Template;
    onConfirm: (placeholders: Placeholder[]) => void;
}

interface DragState {
    id: string;
    offsetX: number;
    offsetY: number;
}

const PlaceholderEditor: React.FC<PlaceholderEditorProps> = ({ template, onConfirm }) => {
    const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
    const [activePlaceholderId, setActivePlaceholderId] = useState<string | null>(null);
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const renderPdf = useCallback(async () => {
        if (template.type === 'application/pdf' && canvasRef.current) {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (!context) return;
            
            const pdf = await pdfjsLib.getDocument(template.url).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1 });
            
            const containerWidth = containerRef.current?.offsetWidth || viewport.width;
            const newScale = containerWidth / viewport.width;
            setScale(newScale);

            const scaledViewport = page.getViewport({ scale: newScale });
            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;
            
            const renderContext = {
                canvasContext: context,
                viewport: scaledViewport,
            };
            await page.render(renderContext).promise;
        }
    }, [template.type, template.url]);

    useEffect(() => {
        renderPdf();
    }, [renderPdf]);

    useEffect(() => {
        const handleResize = () => {
            if (template.type === 'application/pdf') {
                renderPdf();
            } else if (containerRef.current) {
                 const newScale = containerRef.current.offsetWidth / template.width;
                 setScale(newScale);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [template, renderPdf]);

    const addPlaceholder = () => {
        const newPlaceholder: Placeholder = {
            id: `field-${Date.now()}`,
            name: `new_field_${placeholders.length + 1}`,
            x: 20,
            y: 20,
            fontSize: 16,
            color: { r: 0, g: 0, b: 0 },
        };
        setPlaceholders([...placeholders, newPlaceholder]);
        setActivePlaceholderId(newPlaceholder.id);
    };

    const updatePlaceholder = (id: string, newProps: Partial<Placeholder>) => {
        setPlaceholders(placeholders.map(p => p.id === id ? { ...p, ...newProps } : p));
    };
    
    const deletePlaceholder = (id: string) => {
        setPlaceholders(placeholders.filter(p => p.id !== id));
        if (activePlaceholderId === id) {
            setActivePlaceholderId(null);
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
        setActivePlaceholderId(id);
        const rect = e.currentTarget.getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        setDragState({
            id,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
        });
        e.preventDefault();
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!dragState) return;
        const containerRect = containerRef.current!.getBoundingClientRect();
        const x = (e.clientX - containerRect.left - dragState.offsetX) / scale;
        const y = (e.clientY - containerRect.top - dragState.offsetY) / scale;
        updatePlaceholder(dragState.id, { x: Math.round(x), y: Math.round(y) });
    };

    const handleMouseUp = () => {
        setDragState(null);
    };

    const activePlaceholder = placeholders.find(p => p.id === activePlaceholderId);

    const handleConfirm = () => {
        if(placeholders.some(p => p.name.trim() === '')){
            alert("Placeholder names cannot be empty.");
            return;
        }
        const names = placeholders.map(p => p.name);
        if(new Set(names).size !== names.length){
            alert("Placeholder names must be unique.");
            return;
        }
        onConfirm(placeholders);
    };

    return (
        <div className="p-2 sm:p-4 lg:p-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-cyan-400 text-center">Step 2: Place Your Data Fields</h2>
            <p className="text-slate-400 mb-6 max-w-3xl mx-auto text-center">Click "Add Field", then drag the fields to their desired locations. Select a field to edit its name and style. The field name must exactly match a column header in your data file.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div 
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="lg:col-span-2 relative w-full select-none overflow-hidden rounded-lg shadow-lg border border-slate-700"
                >
                    {template.type === 'application/pdf' ? (
                        <canvas ref={canvasRef} />
                    ) : (
                        <img src={template.url} alt="Template" style={{ width: '100%' }} />
                    )}

                    {placeholders.map(p => (
                        <div
                            key={p.id}
                            onMouseDown={(e) => handleMouseDown(e, p.id)}
                            style={{
                                left: `${p.x * scale}px`,
                                top: `${p.y * scale}px`,
                                fontSize: `${p.fontSize * scale}px`,
                                color: `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`,
                                position: 'absolute',
                                cursor: 'move',
                                padding: '2px 4px',
                                border: `2px dashed ${activePlaceholderId === p.id ? '#06b6d4' : 'rgba(255,255,255,0.5)'}`,
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                backgroundColor: 'rgba(0,0,0,0.5)',
                            }}
                            className="transition-all duration-100"
                        >
                            {`{${p.name}}`}
                        </div>
                    ))}
                </div>

                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <button onClick={addPlaceholder} className="w-full mb-4 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-colors">
                        <AddIcon className="w-5 h-5"/>
                        Add Field
                    </button>
                    {activePlaceholder ? (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-xl font-semibold text-cyan-400 flex items-center gap-2"><EditIcon className="w-5 h-5" /> Edit Field</h3>
                             <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Field Name (matches CSV column)</label>
                                <input
                                    type="text"
                                    value={activePlaceholder.name}
                                    onChange={e => updatePlaceholder(activePlaceholder.id, { name: e.target.value })}
                                    className="w-full bg-slate-700 text-white rounded p-2 border border-slate-600 focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Font Size (px)</label>
                                <input
                                    type="number"
                                    value={activePlaceholder.fontSize}
                                    onChange={e => updatePlaceholder(activePlaceholder.id, { fontSize: parseInt(e.target.value, 10) })}
                                    className="w-full bg-slate-700 text-white rounded p-2 border border-slate-600 focus:ring-cyan-500 focus:border-cyan-500"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Color</label>
                                <input
                                    type="color"
                                    value={`#${activePlaceholder.color.r.toString(16).padStart(2, '0')}${activePlaceholder.color.g.toString(16).padStart(2, '0')}${activePlaceholder.color.b.toString(16).padStart(2, '0')}`}
                                    onChange={e => {
                                        const hex = e.target.value.substring(1);
                                        const r = parseInt(hex.substring(0, 2), 16);
                                        const g = parseInt(hex.substring(2, 4), 16);
                                        const b = parseInt(hex.substring(4, 6), 16);
                                        updatePlaceholder(activePlaceholder.id, { color: { r, g, b } });
                                    }}
                                    className="w-full h-10 p-1 bg-slate-700 border border-slate-600 rounded cursor-pointer"
                                />
                            </div>
                            <div className="flex justify-between items-center text-sm text-slate-400">
                                <span>X: {activePlaceholder.x}px</span>
                                <span>Y: {activePlaceholder.y}px</span>
                            </div>
                             <button onClick={() => deletePlaceholder(activePlaceholder.id)} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors">
                                <DeleteIcon className="w-5 h-5"/>
                                Delete Field
                            </button>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 p-8">
                            <p>Select a field to edit its properties, or add a new one.</p>
                        </div>
                    )}
                </div>
            </div>
             <div className="mt-8 text-center">
                 <button 
                    onClick={handleConfirm} 
                    disabled={placeholders.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    Confirm Placeholders & Continue
                </button>
            </div>
        </div>
    );
};

export default PlaceholderEditor;
