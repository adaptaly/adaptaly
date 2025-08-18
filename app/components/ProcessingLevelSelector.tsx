"use client";

import React from 'react';
import { PROCESSING_LEVELS, ProcessingLevel, estimateTokensForFile, formatTokenCost } from '@/app/lib/token-estimator';

interface ProcessingLevelSelectorProps {
  selectedLevel: ProcessingLevel['id'];
  onLevelChange: (level: ProcessingLevel['id']) => void;
  file?: File | null;
  className?: string;
}

export default function ProcessingLevelSelector({ 
  selectedLevel, 
  onLevelChange, 
  file,
  className = "" 
}: ProcessingLevelSelectorProps) {
  return (
    <div className={`processing-selector ${className}`}>
      <h3 className="processing-selector__title">Processing Level</h3>
      <p className="processing-selector__description">
        Choose how thoroughly to analyze your document
      </p>

      <div className="processing-selector__options" role="radiogroup" aria-labelledby="processing-level-title">
        {PROCESSING_LEVELS.map((level) => {
          const isSelected = selectedLevel === level.id;
          const estimatedTokens = file ? estimateTokensForFile(file.size, file.type, level.id) : level.estimatedTokens;
          
          return (
            <label 
              key={level.id} 
              className={`processing-option ${isSelected ? 'processing-option--selected' : ''}`}
            >
              <input
                type="radio"
                name="processing-level"
                value={level.id}
                checked={isSelected}
                onChange={(e) => onLevelChange(e.target.value as ProcessingLevel['id'])}
                className="processing-option__input"
                aria-describedby={`${level.id}-description`}
              />
              
              <div className="processing-option__content">
                <div className="processing-option__header">
                  <h4 className="processing-option__name">{level.name}</h4>
                  <div className="processing-option__cost">
                    {formatTokenCost(estimatedTokens)}
                  </div>
                </div>
                
                <p className="processing-option__description" id={`${level.id}-description`}>
                  {level.description}
                </p>
                
                <div className="processing-option__details">
                  <span className="processing-option__time">{level.estimatedTime}</span>
                  <div className="processing-option__features">
                    {level.features.map((feature, index) => (
                      <span key={index} className="processing-option__feature">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="processing-option__indicator" aria-hidden="true">
                {isSelected ? <CheckIcon /> : <RadioIcon />}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RadioIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}