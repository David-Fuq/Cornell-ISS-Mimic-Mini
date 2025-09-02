import { useGLTF } from "@react-three/drei"
import { useRef, useEffect, useState } from "react"
import { Group, MathUtils, Object3D } from "three"
import { useFrame } from "@react-three/fiber"

useGLTF.preload("/iss_3d_model.glb")

type RotationArray = [number, number, number];

interface ModelProps {
  initialRotation?: RotationArray;
  panelRotations?: Record<string, RotationArray>;
  onPanelsFound?: (panels: string[]) => void;
}

export default function Model({ 
  initialRotation = [0, 0, 0], 
  panelRotations = {},
  onPanelsFound
}: ModelProps) {
    const group = useRef<Group>(null);
    const { nodes, materials, animations, scene } = useGLTF("/iss_3d_model.glb")
    const [panelObjects, setPanelObjects] = useState<Record<string, Object3D>>({});
    
    // Find solar panels in the model
    useEffect(() => {
      if (scene) {
        console.log("Model structure:", scene);
        
        // Find all objects that might be solar panels
        const panels: Record<string, Object3D> = {};
        scene.traverse((object) => {
          // Look for panel-like names in the model
          if (object.name && (
              object.name.toLowerCase().includes('panel') || 
              object.name.toLowerCase().includes('solar') ||
              object.name.toLowerCase().includes('array') ||
              object.name.toLowerCase().includes('wing')
          )) {
            panels[object.name] = object;
          }
        });
        
        console.log("Found potential panel objects:", panels);
        setPanelObjects(panels);
        
        // If no panels are found based on names, try to identify by structure/geometry
        if (Object.keys(panels).length === 0) {
          let panelCount = 0;
          scene.traverse((object) => {
            // Look for large, flat objects that could be panels
            if (object.type === 'Mesh') {
              // For demonstration, we'll just name some objects as panels
              // In a real implementation, you'd need more sophisticated detection
              object.name = `Panel_${panelCount++}`;
              panels[object.name] = object;
            }
          });
        }
        
        // Notify parent component about found panels
        if (onPanelsFound) {
          onPanelsFound(Object.keys(panels));
        }
      }
    }, [scene, onPanelsFound]);
    
    // Apply rotation to the entire model when it changes
    useEffect(() => {
        if (scene) {
            // Scale the model if needed
            scene.scale.set(1, 1, 1);
            
            // Center the model
            scene.position.set(0, 0, 0);
            
            // Set rotation (in radians)
            scene.rotation.set(
                MathUtils.degToRad(initialRotation[0]), // X axis (pitch)
                MathUtils.degToRad(initialRotation[1]), // Y axis (yaw)
                MathUtils.degToRad(initialRotation[2])  // Z axis (roll)
            );
        }
    }, [scene, initialRotation]);
    
    // Apply rotations to individual panels when they change
    useEffect(() => {
      // Apply panel-specific rotations if panels have been identified
      if (Object.keys(panelObjects).length > 0) {
        Object.entries(panelRotations).forEach(([panelName, rotation]) => {
          const panel = panelObjects[panelName];
          if (panel) {
            // Store original rotation if not already stored
            if (!panel.userData.originalRotation) {
              panel.userData.originalRotation = {
                x: panel.rotation.x,
                y: panel.rotation.y,
                z: panel.rotation.z
              };
            }
            
            // Apply the new rotation (in radians)
            panel.rotation.set(
              panel.userData.originalRotation.x + MathUtils.degToRad(rotation[0]),
              panel.userData.originalRotation.y + MathUtils.degToRad(rotation[1]),
              panel.userData.originalRotation.z + MathUtils.degToRad(rotation[2])
            );
          }
        });
      }
    }, [panelObjects, panelRotations]);

    return (
        <group ref={group}>
            <primitive object={scene} />
        </group>
    )
}