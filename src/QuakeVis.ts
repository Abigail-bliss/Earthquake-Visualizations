/* Assignment 3: Earthquake Visualization
 * CSCI 4611, Fall 2022, University of Minnesota
 * Instructor: Evan Suma Rosenberg <suma@umn.edu>
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 */ 

import * as gfx from 'gophergfx'
import { GUI } from 'dat.gui'
import { Earth } from './Earth';
import { EarthquakeDatabase } from './EarthquakeDatabase';

export class QuakeVis extends gfx.GfxApp
{
    private earth: Earth;
    private earthquakeDB: EarthquakeDatabase;

    // State variables
    private currentTime : number;

    // GUI variables
    private gui : GUI;
    private date : string;
    private viewMode : string;
    private playbackSpeed : number;
    private debugMode : boolean;
    private alpha: boolean;
    private doSpin: boolean;
    
    constructor()
    {
        super();

        this.earth = new Earth();
        this.earthquakeDB = new EarthquakeDatabase('./assets/earthquakes.txt');

        this.currentTime = Infinity;

        this.gui = new GUI();
        this.date = '';
        this.viewMode = 'Map';
        this.playbackSpeed = 0.5;
        this.debugMode = false;
        this.doSpin = false;
    }

    createScene(): void 
    {
        // Setup camera
        this.camera.setPerspectiveCamera(60, 2, 0.1, 50)
        this.camera.position.set(0, 0, 3.25);
        this.camera.lookAt(gfx.Vector3.ZERO);

        // Create a directional light
        const directionalLight = new gfx.DirectionalLight(new gfx.Vector3(1.5, 1.5, 1.5));
        directionalLight.position.set(10, 10, 15);
        this.scene.add(directionalLight);

        // Set the background image
        const background = new gfx.Rectangle(2, 2);
        background.material.texture = new gfx.Texture('./assets/stars.png');
        background.layer = 1;
        this.scene.add(background);

        // Create the earth mesh and add it to the scene
        this.earth.createMesh();
        this.scene.add(this.earth);

        // Create a new GUI folder to hold earthquake controls
        const controls = this.gui.addFolder('Earthquake Controls');

        // Create a GUI control to show the current date and make it listen for changes
        const dateController = controls.add(this, 'date');
        dateController.name('Current Date');
        dateController.listen();

        // Create a GUI control for the view mode and add a change event handler
        const viewController = controls.add(this, 'viewMode', {Map: 'Map', Globe: 'Globe'});
        viewController.name('View Mode');
        viewController.onChange((value: string) => { this.earth.toggleGlobeMode(value);
                                                    this.viewMode == value;
                                                    console.log(this.viewMode)
                                                });
        
        // Create a GUI control for the playback speed and add a change event handler
        const playbackController = controls.add(this, 'playbackSpeed', 0, 10);
        playbackController.name('Playback Speed');

        // Create a GUI control for the debug mode and add a change event handler
        const debugController = controls.add(this, 'debugMode');
        debugController.name('Debug Mode');
        debugController.onChange((value: boolean) => { this.earth.toggleDebugMode(value) });


        // const doSpin = controls.add(this, 'doSpin');
        // doSpin.name('Do Spin');
        // doSpin.onChange((value: boolean) => { this.earth.doSpin(value) });


        // Make the GUI controls wider and open by default
        this.gui.width = 300;
        controls.open();
    }

    update(deltaTime: number): void 
    {
        // Scale factor for time progression
        const playbackScale = 30000000000;

        // Advance current time in milliseconds
        this.currentTime += playbackScale * this.playbackSpeed * deltaTime;

        // If we are beyond the max time, loop back to the beginning
        if(this.currentTime > this.earthquakeDB.getMaxTime())
        {
            this.currentTime = this.earthquakeDB.getMinTime();
            this.earthquakeDB.reset();
        }

        // Update the current date
        const currentDate = new Date();
        currentDate.setTime(this.currentTime);
        this.date = currentDate.getUTCMonth() + "/" + currentDate.getUTCDate() + "/" + currentDate.getUTCFullYear();

        // Create the earthquakes!
        let quake = this.earthquakeDB.getNextQuake(currentDate);
        while(quake)
        {
            // TO DO: Calculate the actual normalized magnitude
            const normalizedMagnitude = 1;

            // Uncomment this line of code to start creating earthquake markers
            // They will initially be placed at random locations on a plane
            // You will need to update the code to compute correct positions on the map and globe
            this.earth.createEarthquake(quake, normalizedMagnitude);

            quake = this.earthquakeDB.getNextQuake(currentDate);
        }

        // Update the earth animations
        this.earth.update(deltaTime);

        // Animate the earthquakes and remove old ones
        this.earth.animateEarthquakes(this.currentTime);
    }

    // Mouse event handler for optional wizard functionality
    onMouseMove(event: MouseEvent): void
    {
        if(event.buttons > 0)
        {
            // You can add code here if you want to rotate the earth with the mouse,
            // similar to the instructor's implementation.  This is not required
            // to complete the base assignment.
        }
    }

    // Mouse event handler for optional wizard functionality
    onMouseWheel(event: WheelEvent): void 
    {
        // You can add code here if you want to zoom in and out using the wheel,
        // similar to the instructor's implementation.  This is not required
        // to complete the base assignment.
    }
}