'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Card, Button } from '@tremor/react';
import { CircleStackIcon } from '@heroicons/react/24/outline';
import { Plus, Minus, HelpCircle } from 'lucide-react';

export default function SchemaPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    setPosition({
      x: newX,
      y: newY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const STEP = 50;
    
    switch (e.key) {
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
      case '_':
        handleZoomOut();
        break;
      case 'ArrowLeft':
        setPosition(prev => ({ ...prev, x: prev.x + STEP }));
        break;
      case 'ArrowRight':
        setPosition(prev => ({ ...prev, x: prev.x - STEP }));
        break;
      case 'ArrowUp':
        setPosition(prev => ({ ...prev, y: prev.y + STEP }));
        break;
      case 'ArrowDown':
        setPosition(prev => ({ ...prev, y: prev.y - STEP }));
        break;
      case 'r':
        resetZoom();
        break;
    }
  }, [handleZoomIn, handleZoomOut, resetZoom]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <CircleStackIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Database Schema</h1>
              <p className="text-sm text-gray-500">
                Visual representation of the database structure and table relationships.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200">
        <div className="space-y-6 p-6">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-gray-900">Schema Diagram</h2>
                <p className="text-sm text-gray-500 mt-1">Use the controls to zoom, or click and drag to pan the diagram.</p>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 shadow-sm p-2">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className="bg-white hover:bg-gray-50 flex items-center gap-2 min-w-[80px] justify-center"
                  title="Arrow keys to pan | +/- to zoom | R to reset"
                >
                  Reset
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                </Button>
                <div className="h-4 w-px bg-gray-200" />
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  className="bg-white hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  className="bg-white hover:bg-gray-50"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div 
              className="relative w-full h-[calc(100vh-400px)] min-h-[600px] overflow-hidden bg-white"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                className={`absolute inset-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                  }}
                >
                  <Image
                    src="/images/ProviderCompDBSchema.svg"
                    alt="Database Schema"
                    width={1200}
                    height={900}
                    className="max-w-none object-contain"
                    style={{
                      maxHeight: 'calc(100vh-400px)',
                      width: 'auto'
                    }}
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          </div>

          <Card className="ring-1 ring-gray-200">
            <div className="p-6">
              <h2 className="font-semibold text-gray-900">Table Descriptions</h2>
              <p className="text-sm text-gray-500 mt-1">Overview of the main database tables and their purposes.</p>
            </div>
            
            <div className="border-t">
              <div className="p-6 space-y-8">
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Core Tables</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">Provider</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Central table storing provider information including employee ID, name, specialty, department, employment status, 
                        hire date, FTE details (clinical/non-clinical), base salary, compensation model, and target WRVUs.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">ProviderMetrics</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Monthly performance metrics tracking actual WRVUs, raw monthly WRVUs, YTD WRVUs, target WRVUs, base salary, 
                        total compensation, incentives earned, holdback amounts, and percentile calculations for WRVUs and compensation.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">ProviderAnalytics</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Monthly analytics data including YTD progress, target progress, incentive percentage calculations, 
                        and clinical utilization metrics.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">WRVUData</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Monthly WRVU data entries storing actual WRVU values and hours worked, linked to individual providers.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">MarketData</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Specialty-specific benchmark data including percentile values (25th, 50th, 75th, 90th) for total compensation, 
                        WRVUs, and conversion factors.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Adjustment & Settings Tables</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">WRVUAdjustment</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Tracks manual adjustments to provider WRVU values, including the reason for adjustment and the adjustment value.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">TargetAdjustment</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Records adjustments to provider WRVU targets, including adjustment reason and value.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">AdditionalPay</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Tracks additional payments or bonuses given to providers, including payment name, description, and amount.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">ProviderSettings</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Stores provider-specific settings such as holdback percentage for compensation calculations.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">History & Change Tracking</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">CompensationChange</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Records changes to provider compensation, including previous and new values for salary, FTE, and conversion factors.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">WRVUHistory</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Audit trail for changes to WRVU data entries, tracking field changes, change type, and who made the change.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">MarketDataHistory</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Tracks changes to market data benchmarks, including field changes, change type, and modification details.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 