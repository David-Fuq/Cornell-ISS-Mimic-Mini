'use client';

import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import Model from "./Model"
import { Suspense, useState, useEffect, useRef } from "react"

type PresetName = 'front' | 'top' | 'side' | 'panels' | 'custom1' | 'custom2' | 'none';
type RotationArray = [number, number, number];

// Predefined view presets
const viewPresets: Record<Exclude<PresetName, 'none'>, RotationArray> = {
    front: [0, 0, 0],
    top: [90, 0, 0],
    side: [0, 90, 0],
    panels: [30, 45, 15], // A specific angle to view the solar panels
    custom1: [0, 0, 0],
    custom2: [0, 0, 0],
};

export default function Scene() {
    // Define state for model rotation in degrees [x, y, z]
    const [modelRotation, setModelRotation] = useState<RotationArray>([0, 0, 0]);
    const [activePreset, setActivePreset] = useState<PresetName>('front');
    const [customPresets, setCustomPresets] = useState<{
        custom1: RotationArray;
        custom2: RotationArray;
    }>({
        custom1: [0, 0, 0],
        custom2: [0, 0, 0],
    });
    
    // State for panel controls
    const [panelList, setPanelList] = useState<string[]>([]);
    const [selectedPanel, setSelectedPanel] = useState<string>('');
    const [panelRotations, setPanelRotations] = useState<Record<string, RotationArray>>({});
    const [showPanelControls, setShowPanelControls] = useState<boolean>(false);

    // Reference to store panel info from the Model component
    const panelInfoRef = useRef<{panels: string[]}>({ panels: [] });
    
    // Function to receive panel information from the Model component
    const handlePanelsFound = (panels: string[]) => {
        setPanelList(panels);
        panelInfoRef.current.panels = panels;
        
        // Initialize rotation state for each panel
        const initialRotations: Record<string, RotationArray> = {};
        panels.forEach(panel => {
            initialRotations[panel] = [0, 0, 0];
        });
        setPanelRotations(initialRotations);
    };

    // Function to handle rotation change for the main model
    const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
        setModelRotation(prev => {
            const newRotation = [...prev] as RotationArray;
            if (axis === 'x') newRotation[0] = value;
            if (axis === 'y') newRotation[1] = value;
            if (axis === 'z') newRotation[2] = value;
            return newRotation;
        });
        setActivePreset('none'); // Set to none when manually adjusting
    };
    
    // Function to handle rotation change for a specific panel
    const handlePanelRotationChange = (panel: string, axis: 'x' | 'y' | 'z', value: number) => {
        setPanelRotations(prev => {
            const newRotations = { ...prev };
            if (!newRotations[panel]) {
                newRotations[panel] = [0, 0, 0];
            }
            const rotation = [...newRotations[panel]] as RotationArray;
            if (axis === 'x') rotation[0] = value;
            if (axis === 'y') rotation[1] = value;
            if (axis === 'z') rotation[2] = value;
            newRotations[panel] = rotation;
            return newRotations;
        });
    };

    // Function to apply a preset
    const applyPreset = (presetName: Exclude<PresetName, 'none'>) => {
        if (presetName === 'custom1' || presetName === 'custom2') {
            setModelRotation(customPresets[presetName]);
        } else {
            setModelRotation(viewPresets[presetName]);
        }
        setActivePreset(presetName);
    };

    // Function to save current angle as a custom preset
    const saveAsCustom = (presetName: 'custom1' | 'custom2') => {
        setCustomPresets(prev => ({
            ...prev,
            [presetName]: [...modelRotation] as RotationArray
        }));
        setActivePreset(presetName);
    };
    
    // Function to toggle panel controls visibility
    const togglePanelControls = () => {
        setShowPanelControls(prev => !prev);
    };
    
    // Function to reset all panel rotations
    const resetAllPanelRotations = () => {
        const resetRotations: Record<string, RotationArray> = {};
        panelList.forEach(panel => {
            resetRotations[panel] = [0, 0, 0];
        });
        setPanelRotations(resetRotations);
    };
    
    // Function to save panel rotations to localStorage
    const savePanelRotations = () => {
        localStorage.setItem('issPanelRotations', JSON.stringify(panelRotations));
    };

    // Load saved presets from localStorage on component mount
    useEffect(() => {
        const savedCustomPresets = localStorage.getItem('issCustomViewPresets');
        if (savedCustomPresets) {
            try {
                const parsed = JSON.parse(savedCustomPresets);
                if (parsed.custom1 && parsed.custom2) {
                    setCustomPresets(parsed);
                }
            } catch (e) {
                console.error("Failed to parse saved presets", e);
            }
        }
        
        // Load saved panel rotations
        const savedPanelRotations = localStorage.getItem('issPanelRotations');
        if (savedPanelRotations) {
            try {
                const parsed = JSON.parse(savedPanelRotations);
                setPanelRotations(parsed);
            } catch (e) {
                console.error("Failed to parse saved panel rotations", e);
            }
        }
    }, []);

    // Save custom presets to localStorage when they change
    useEffect(() => {
        localStorage.setItem('issCustomViewPresets', JSON.stringify(customPresets));
    }, [customPresets]);

    return (
        <div className="w-full h-full flex flex-col">
            {/* Controls for manual angle adjustment */}
            <div className="p-4 bg-opacity-70 bg-black text-white z-10 overflow-auto max-h-[50vh]">
                <div className="flex flex-col space-y-4">
                    {/* Main controls and Solar Panel Controls tabs */}
                    <div className="flex border-b border-gray-600 mb-2">
                        <button 
                            onClick={() => setShowPanelControls(false)}
                            className={`px-3 py-1 ${!showPanelControls ? 'border-b-2 border-blue-500' : 'text-gray-400'}`}
                        >
                            Main Controls
                        </button>
                        <button 
                            onClick={() => setShowPanelControls(true)}
                            className={`px-3 py-1 ${showPanelControls ? 'border-b-2 border-blue-500' : 'text-gray-400'}`}
                        >
                            Solar Panel Controls
                        </button>
                    </div>
                    
                    {!showPanelControls ? (
                        // Main model controls
                        <>
                            {/* Preset buttons */}
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={() => applyPreset('front')} 
                                    className={`px-3 py-1 rounded ${activePreset === 'front' ? 'bg-blue-600' : 'bg-gray-700'}`}
                                >
                                    Front View
                                </button>
                                <button 
                                    onClick={() => applyPreset('top')} 
                                    className={`px-3 py-1 rounded ${activePreset === 'top' ? 'bg-blue-600' : 'bg-gray-700'}`}
                                >
                                    Top View
                                </button>
                                <button 
                                    onClick={() => applyPreset('side')} 
                                    className={`px-3 py-1 rounded ${activePreset === 'side' ? 'bg-blue-600' : 'bg-gray-700'}`}
                                >
                                    Side View
                                </button>
                                <button 
                                    onClick={() => applyPreset('panels')} 
                                    className={`px-3 py-1 rounded ${activePreset === 'panels' ? 'bg-blue-600' : 'bg-gray-700'}`}
                                >
                                    Solar Panels
                                </button>
                                <button 
                                    onClick={() => applyPreset('custom1')} 
                                    className={`px-3 py-1 rounded ${activePreset === 'custom1' ? 'bg-blue-600' : 'bg-gray-700'}`}
                                >
                                    Custom 1
                                </button>
                                <button 
                                    onClick={() => applyPreset('custom2')} 
                                    className={`px-3 py-1 rounded ${activePreset === 'custom2' ? 'bg-blue-600' : 'bg-gray-700'}`}
                                >
                                    Custom 2
                                </button>
                            </div>

                            {/* Save current view buttons */}
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => saveAsCustom('custom1')} 
                                    className="px-3 py-1 rounded bg-green-700"
                                >
                                    Save as Custom 1
                                </button>
                                <button 
                                    onClick={() => saveAsCustom('custom2')} 
                                    className="px-3 py-1 rounded bg-green-700"
                                >
                                    Save as Custom 2
                                </button>
                            </div>

                            {/* Sliders for fine-tuning */}
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center">
                                    <label className="w-32">X Rotation:</label>
                                    <input 
                                        type="range" 
                                        min="-180" 
                                        max="180" 
                                        value={modelRotation[0]} 
                                        onChange={(e) => handleRotationChange('x', parseInt(e.target.value))}
                                        className="flex-grow"
                                    />
                                    <span className="ml-2 w-12">{modelRotation[0]}°</span>
                                </div>
                                <div className="flex items-center">
                                    <label className="w-32">Y Rotation:</label>
                                    <input 
                                        type="range" 
                                        min="-180" 
                                        max="180" 
                                        value={modelRotation[1]} 
                                        onChange={(e) => handleRotationChange('y', parseInt(e.target.value))}
                                        className="flex-grow"
                                    />
                                    <span className="ml-2 w-12">{modelRotation[1]}°</span>
                                </div>
                                <div className="flex items-center">
                                    <label className="w-32">Z Rotation:</label>
                                    <input 
                                        type="range" 
                                        min="-180" 
                                        max="180" 
                                        value={modelRotation[2]} 
                                        onChange={(e) => handleRotationChange('z', parseInt(e.target.value))}
                                        className="flex-grow"
                                    />
                                    <span className="ml-2 w-12">{modelRotation[2]}°</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Solar panel specific controls
                        <>
                            <div className="flex flex-col space-y-4">
                                {panelList.length === 0 ? (
                                    <div className="p-2 bg-yellow-800 text-yellow-100 rounded">
                                        Waiting for solar panel detection in the model...
                                        <br/>
                                        If no panels are detected, your model may not have named panel objects.
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap gap-2">
                                            <button 
                                                onClick={resetAllPanelRotations} 
                                                className="px-3 py-1 rounded bg-red-700"
                                            >
                                                Reset All Panels
                                            </button>
                                            <button 
                                                onClick={savePanelRotations} 
                                                className="px-3 py-1 rounded bg-green-700"
                                            >
                                                Save Panel Positions
                                            </button>
                                        </div>

                                        <div>
                                            <label className="block mb-1">Select Panel:</label>
                                            <select 
                                                value={selectedPanel} 
                                                onChange={(e) => setSelectedPanel(e.target.value)}
                                                className="w-full p-2 bg-gray-800 rounded"
                                            >
                                                <option value="">-- Select a panel --</option>
                                                {panelList.map(panel => (
                                                    <option key={panel} value={panel}>{panel}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {selectedPanel && (
                                            <div className="mt-2 p-3 bg-gray-800 rounded">
                                                <h3 className="font-bold mb-2">Adjust {selectedPanel}</h3>
                                                <div className="flex flex-col space-y-2">
                                                    <div className="flex items-center">
                                                        <label className="w-32">X Rotation:</label>
                                                        <input 
                                                            type="range" 
                                                            min="-180" 
                                                            max="180" 
                                                            value={panelRotations[selectedPanel]?.[0] || 0} 
                                                            onChange={(e) => handlePanelRotationChange(selectedPanel, 'x', parseInt(e.target.value))}
                                                            className="flex-grow"
                                                        />
                                                        <span className="ml-2 w-12">{panelRotations[selectedPanel]?.[0] || 0}°</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <label className="w-32">Y Rotation:</label>
                                                        <input 
                                                            type="range" 
                                                            min="-180" 
                                                            max="180" 
                                                            value={panelRotations[selectedPanel]?.[1] || 0} 
                                                            onChange={(e) => handlePanelRotationChange(selectedPanel, 'y', parseInt(e.target.value))}
                                                            className="flex-grow"
                                                        />
                                                        <span className="ml-2 w-12">{panelRotations[selectedPanel]?.[1] || 0}°</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <label className="w-32">Z Rotation:</label>
                                                        <input 
                                                            type="range" 
                                                            min="-180" 
                                                            max="180" 
                                                            value={panelRotations[selectedPanel]?.[2] || 0} 
                                                            onChange={(e) => handlePanelRotationChange(selectedPanel, 'z', parseInt(e.target.value))}
                                                            className="flex-grow"
                                                        />
                                                        <span className="ml-2 w-12">{panelRotations[selectedPanel]?.[2] || 0}°</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            {/* 3D Canvas */}
            <div className="flex-grow">
                <Canvas>
                    <PerspectiveCamera makeDefault position={[0, 0, 10]} />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[-5, -5, 5]} intensity={1.5} />
                    <Suspense fallback={null}>
                        <Model 
                            initialRotation={modelRotation} 
                            panelRotations={panelRotations}
                            onPanelsFound={handlePanelsFound}
                        />
                        <OrbitControls 
                            enableZoom={true}
                            enablePan={true}
                            enableRotate={true}
                            zoomSpeed={0.6}
                            panSpeed={0.5}
                            rotateSpeed={0.5}
                        />
                    </Suspense>
                </Canvas>
            </div>
        </div>
    )
}