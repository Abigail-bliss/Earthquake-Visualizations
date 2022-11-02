/* Assignment 3: Earthquake Visualization
 * CSCI 4611, Fall 2022, University of Minnesota
 * Instructor: Evan Suma Rosenberg <suma@umn.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

import * as gfx from 'gophergfx'
import { MathUtils, Vector3 } from 'gophergfx';
import { EarthquakeMarker } from './EarthquakeMarker';
import { EarthquakeRecord } from './EarthquakeRecord';
import { QuakeVis } from './QuakeVis';

export class Earth extends gfx.Transform3
{
    private earthMesh: gfx.Mesh;
    private earthMaterial: gfx.MorphMaterial;

    public globeMode: boolean;
    public naturalRotation: gfx.Quaternion;
    public mouseRotation: gfx.Quaternion;

    public toggled: boolean;

    constructor()
    {
        // Call the superclass constructor
        super();

        this.earthMesh = new gfx.Mesh();
        this.earthMaterial = new gfx.MorphMaterial();

        this.globeMode = false;
        this.naturalRotation = new gfx.Quaternion();
        this.mouseRotation = new gfx.Quaternion();

        this.toggled = false;
    }

    public createMesh() : void
    {
        // Initialize texture: you can change to a lower-res texture here if needed
        // Note that this won't display properly until you assign texture coordinates to the mesh
        this.earthMaterial.texture = new gfx.Texture('./assets/earth-2k.png');
        
        // This disables mipmapping, which makes the texture appear sharper
        this.earthMaterial.texture.setMinFilter(true, false);

        // 20x20 is reasonable for a good looking sphere
        // 150x150 is better for height mapping
        const meshResolution = 20;     
        //const meshResolution = 150;

        // A rotation about the Z axis is the earth's axial tilt
        this.naturalRotation.setRotationZ(-23.4 * Math.PI / 180); 
        
        // Precalculated vertices, normals, and triangle indices.
        // After we compute them, we can store them directly in the earthMesh,
        // so they don't need to be member variables.
        const mapVertices: number[] = [];
        const mapNormals: number[] = [];
        const texCoords: number[] = [];
        const indices: number[] = [];
        
        const cols = 50;
        const rows = 50;
        const pi = Math.PI;

        const colIncr = (2*pi) / cols;
        const rowIncr = pi / rows;

        //FLAT MAP
        for (let rowPos = -(pi/2); rowPos < (pi/2); rowPos += rowIncr){
            for (let colPos = -pi; colPos < pi; colPos += colIncr){
                const currIndex = mapVertices.length / 3;   
                mapVertices.push(colPos, rowPos, 0);           
                mapVertices.push(colPos, rowPos + rowIncr, 0); 

                mapNormals.push(0, 0, 1);
                mapNormals.push(0, 0, 1);

                const colPosRescaled = MathUtils.rescale(colPos, -pi, pi, 0, 1);
                const rowPosRescaled = 1 - MathUtils.rescale(rowPos, -pi/2, pi/2, 0, 1);

                texCoords.push(colPosRescaled, rowPosRescaled);
                texCoords.push(colPosRescaled, rowPosRescaled - 1/rows);

                indices.push(currIndex, currIndex + 3, currIndex + 1); 
                indices.push(currIndex, currIndex + 2, currIndex + 3); 
            }
            mapVertices.push(pi, rowPos, 0);           
            mapVertices.push(pi, rowPos + rowIncr, 0);  

            mapNormals.push(0, 0, 1);
            mapNormals.push(0, 0, 1);

            const rowPosRescaled = 1-MathUtils.rescale(rowPos, -pi/2, pi/2, 0, 1);
            texCoords.push(1, rowPosRescaled);
            texCoords.push(1, rowPosRescaled - 1/rows);
        }

        //ROUND MAP
        const globeVertices: number[] = [];
        const globeNormals: number[] = [];
        for (let i = 0; i < mapVertices.length; i+=3){
            const vertsConverted = this.convertLatLongToSphere(mapVertices[i+1], mapVertices[i]);
            globeVertices.push(vertsConverted.x, vertsConverted.y, vertsConverted.z);           
            globeNormals.push(vertsConverted.x, vertsConverted.y, vertsConverted.z);           
        }

        this.earthMesh.setMorphTargetVertices(globeVertices);
        this.earthMesh.setMorphTargetNormals(globeNormals);
        

        // Set all the earth mesh data
        this.earthMesh.setVertices(mapVertices, true);
        this.earthMesh.setNormals(mapNormals, true);
        this.earthMesh.setIndices(indices);
        this.earthMesh.setTextureCoordinates(texCoords);
        this.earthMesh.createDefaultVertexColors();
        this.earthMesh.material = this.earthMaterial;

        // Add the mesh to this group
        this.add(this.earthMesh);

    }

    // TO DO: add animations for mesh morphing
    public update(deltaTime: number) : void
    {
        if (this.toggled){
            const morphSpeed = 0.75;
            let morphDirection;
            if (this.globeMode == false) {
                morphDirection = -1;
            } else {
                morphDirection = 1;
            }
            this.earthMaterial.morphAlpha = gfx.MathUtils.clamp(this.earthMaterial.morphAlpha, 0, 1);

            if(this.earthMaterial.morphAlpha >= 0 && this.earthMaterial.morphAlpha <= 1)
            {
                this.earthMaterial.morphAlpha += morphSpeed * morphDirection * deltaTime;
                // this.animateEarthquakes(this.earthMaterial.morphAlpha);
                
            }
            
            if(this.earthMaterial.morphAlpha < 0 || this.earthMaterial.morphAlpha > 1){
                this.toggled = false;
            }
        }


        
    }

    public createEarthquake(record: EarthquakeRecord, normalizedMagnitude : number)
    {
        // Number of milliseconds in 1 year (approx.)
        const duration = 12 * 28 * 24 * 60 * 60;

        // TO DO: currently, the earthquake is just placed randomly on the plane
        // You will need to update this code to calculate both the map and globe positions
        const convertedMapCoords = this.convertLatLongToPlane(record.latitude, record.longitude);
        const mapPosition = new gfx.Vector3(convertedMapCoords.x, convertedMapCoords.y);

        const latDegreesToRadians = MathUtils.rescale(record.latitude, -90, 90, -(Math.PI)/2, (Math.PI)/2);
        const longDegreesToRadians = MathUtils.rescale(record.longitude, -180, 180, -Math.PI, Math.PI);
        const convertedGlobeCoords = this.convertLatLongToSphere(latDegreesToRadians, longDegreesToRadians);
        const globePosition = new gfx.Vector3(convertedGlobeCoords.x, convertedGlobeCoords.y, convertedGlobeCoords.z);
        
        const earthquake = new EarthquakeMarker(mapPosition, globePosition, record, duration);

        // Initially, the color is set to yellow.
        // You should update this to be more a meaningful representation of the data.
        const quakeMag = 1 - MathUtils.rescale(record.magnitude, 6, 9, 0, 1);
        earthquake.material.setColor(new gfx.Color(1, quakeMag, 0));

        this.add(earthquake);
    }

    public animateEarthquakes(currentTime : number)
    {
        // This code removes earthquake markers after their life has expired
        this.children.forEach((quake: gfx.Transform3) => {
            if(quake instanceof EarthquakeMarker)
            {
                const playbackLife = (quake as EarthquakeMarker).getPlaybackLife(currentTime);
                if(playbackLife >= 1)
                {
                    quake.remove();
                }
                else
                {
                    // if (this.globeMode){
                    //     quake.position.copy(quake.globePosition);
                    // }else {
                    //     quake.position.copy(quake.mapPosition);
                    // }
                    //set position and scale

                    quake.position.copy(Vector3.lerp(quake.mapPosition, quake.globePosition, this.earthMaterial.morphAlpha));

                    // const quakeScale = new gfx.Vector3(0.8*quake.magnitude, 0.8*quake.magnitude, 0.5);
                    // quakeScale.lerp(quakeScale, Vector3.ZERO, currentTime);
                    // quake.scale.set(quakeScale.x, quakeScale.y, quakeScale.z);
                    //make size of dot scaled to magnitude of earthquake

                    //multipy by playback life
                    quake.scale.set((1 - playbackLife)*0.8*quake.magnitude, (1 - playbackLife)*0.8*quake.magnitude, (1 - playbackLife)*0.5);

                }
            }
        });
    }

    public convertLatLongToSphere(latitude: number, longitude: number) : gfx.Vector3
    {
        const x = Math.cos(latitude) * Math.sin(longitude);
        const y = Math.sin(latitude);
        const z = Math.cos(latitude) * Math.cos(longitude);

        return new gfx.Vector3(x, y, z);
    }

    public convertLatLongToPlane(latitude: number, longitude: number) : gfx.Vector3
    {
        const pi = Math.PI;
        const latitudeNew = MathUtils.rescale(latitude, -90, 90, -pi/2, pi/2);
        const longitudeNew = MathUtils.rescale(longitude, -180, 180, -pi, pi);
        
        return new gfx.Vector3(longitudeNew, latitudeNew);
    }

    // This function toggles the wireframe debug mode on and off
    public toggleDebugMode(debugMode : boolean)
    {
        this.earthMaterial.wireframe = debugMode;
    }

    public toggleGlobeMode(mode : string)
    {
        this.toggled = true;
        if (mode == 'Globe'){
            this.globeMode = true;
        } 
        if (mode == 'Map'){
            this.globeMode = false;
        }
    }

    // public doSpin(doSpin: boolean){
    //     QuakeVis.
    // }
}
