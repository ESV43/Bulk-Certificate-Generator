
import React from 'react';

interface StepIndicatorProps {
    currentStep: number;
    onStepClick: (step: number) => void;
}

const steps = [
    { number: 1, title: 'Upload Template' },
    { number: 2, title: 'Place Fields' },
    { number: 3, title: 'Upload Data' },
    { number: 4, title: 'Generate' },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onStepClick }) => {
    return (
        <div className="w-full px-4 sm:px-8">
            <div className="relative flex items-center justify-between">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-slate-700" />
                <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-cyan-500 transition-all duration-500 ease-in-out" 
                    style={{ width: `${((Math.min(currentStep, 4) - 1) / (steps.length - 1)) * 100}%` }}
                />
                {steps.map(step => {
                    const isCompleted = currentStep > step.number;
                    const isActive = currentStep === step.number;
                    const isClickable = currentStep > step.number && step.number < 5; // Can go back, but not forward or to success step

                    return (
                        <div
                            key={step.number}
                            className={`relative z-10 flex flex-col items-center ${isClickable ? 'cursor-pointer' : ''}`}
                            onClick={isClickable ? () => onStepClick(step.number) : undefined}
                        >
                            <div
                                className={`
                                    w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 
                                    transition-all duration-300
                                    ${isActive ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/30' : ''}
                                    ${isCompleted ? 'bg-slate-800 border-cyan-500 text-cyan-500' : ''}
                                    ${!isActive && !isCompleted ? 'bg-slate-800 border-slate-600 text-slate-400' : ''}
                                `}
                            >
                                {isCompleted ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <span className="font-bold text-lg">{step.number}</span>
                                )}
                            </div>
                            <p className={`
                                mt-2 text-xs sm:text-sm text-center font-semibold
                                ${isActive ? 'text-cyan-400' : 'text-slate-400'}
                            `}>
                                {step.title}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StepIndicator;
