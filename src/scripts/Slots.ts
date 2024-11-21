import Phaser from 'phaser';
import { Globals, ResultData, initData } from "./Globals";
import { gameConfig } from './appconfig';
import { UiContainer } from './UiContainer';
import SoundManager from './SoundManager';
import Disconnection from './Disconecction';
export class Slots extends Phaser.GameObjects.Container {
    slotMask: Phaser.GameObjects.Graphics;
    SoundManager: SoundManager
    slotSymbols: any[][] = [];
    moveSlots: boolean = false;
    uiContainer!: UiContainer;
    // winingMusic!: Phaser.Sound.BaseSound
    resultCallBack: () => void;
    slotFrame!: Phaser.GameObjects.Sprite;
    private maskWidth: number;
    private maskHeight: number;
    private symbolKeys: string[];
    private symbolWidth: number;
    private symbolHeight: number;
    private spacingX: number;
    private spacingY: number;
    isCascading: boolean = false;
    private reelContainers: Phaser.GameObjects.Container[] = [];
    private connectionTimeout!: Phaser.Time.TimerEvent;
    private ufoSprites: Phaser.GameObjects.Sprite[] = []; // Array to store UFO sprites
    private reelTweens: Phaser.Tweens.Tween[] = []; // Array for reel tweens
    private totalVisibleSymbols: number = 3; // Number of visible symbols on the reel
    private laserGroup!: Phaser.GameObjects.Group;
    constructor(scene: Phaser.Scene, uiContainer: UiContainer, callback: () => void, SoundManager : SoundManager) {
        super(scene);

        this.resultCallBack = callback;
        this.uiContainer = uiContainer;
        this.SoundManager = SoundManager
        this.slotMask = new Phaser.GameObjects.Graphics(scene);
        
        this.maskWidth = gameConfig.scale.width;
        this.maskHeight = 560;
        // this.slotMask.fillStyle(0xffffff, 1);
        this.slotMask.fillRoundedRect(0, 0, this.maskWidth, this.maskHeight, 20);
        // mask Position set
        this.slotMask.setPosition(
            gameConfig.scale.width / 5,
            gameConfig.scale.height / 4
        );
        // this.add(this.slotMask);
        // Filter and pick symbol keys based on the criteria
        this.symbolKeys = this.getFilteredSymbolKeys();
        
        // Assume all symbols have the same width and height
        const exampleSymbol = new Phaser.GameObjects.Sprite(scene, 0, 0, this.getRandomSymbolKey());
        this.symbolWidth = exampleSymbol.displayWidth/ 5.1;
        this.symbolHeight = exampleSymbol.displayHeight/5;
        this.spacingX = this.symbolWidth * 4.8; // Add some spacing
        this.spacingY = this.symbolHeight * 4.5; // Add some spacing
        // console.log(this.symbolHeight, "symbolHeightsymbolHeightsymbolHeight");
        
        const startPos = {
            x: gameConfig.scale.width /3.52,
            y: gameConfig.scale.height / 2   
        };
        const totalSymbol = 5;
        const visibleSymbol = 3;
        const startIndex = 1;
        const initialYOffset = (totalSymbol - startIndex - visibleSymbol) * this.spacingY;
        const totalSymbolsPerReel = 3; 
        for (let i = 0; i < 5; i++) { // 5 columns
            const reelContainer = new Phaser.GameObjects.Container(this.scene);
            this.reelContainers.push(reelContainer); // Store the container for future use
            
            this.slotSymbols[i] = [];
            for (let j = 0; j < totalSymbolsPerReel; j++) { // 3 rows
                let symbolKey = this.getRandomSymbolKey(); // Get a random symbol key
                // console.log(symbolKey);
                let slot = new Symbols(scene, symbolKey, { x: i, y: j }, reelContainer);
                slot.symbol.setMask(new Phaser.Display.Masks.GeometryMask(scene, this.slotMask));
                slot.symbol.setPosition(
                    startPos.x + i * (this.spacingX),
                    startPos.y + j * (11 + this.spacingY)
                );
                slot.symbol.setScale(0.75)
                slot.startX = slot.symbol.x;
                slot.startY = slot.symbol.y;
                this.slotSymbols[i].push(slot);
                reelContainer.add(slot.symbol)
            }
            reelContainer.height = this.slotSymbols[i].length * this.spacingY;
            reelContainer.setPosition(reelContainer.x, -initialYOffset);
            this.add(reelContainer); 
        }
        this.createUFOs();
    }

    getFilteredSymbolKeys(): string[] {
        // Filter symbols based on the pattern
        const allSprites = Globals.resources;
        const allSpriteKeys = Object.keys(Globals.resources); // Get all keys from Globals.resources
        const filteredSprites = allSpriteKeys.filter(spriteName => {
            const regex = /^slots\d+_\d+$/; // Your original regex is correct
            return regex.test(spriteName);
        });
        return filteredSprites;
    }

    getRandomSymbolKey(): string {
        const randomIndex = Phaser.Math.Between(0, this.symbolKeys.length - 1);        
        return this.symbolKeys[randomIndex];
    }

    moveReel() {    
        this.disableSpinButton();
        for (let i = 0; i < this.reelContainers.length; i++) {
            // Move visible symbols downward and out of view
            for (let j = 0; j < this.totalVisibleSymbols; j++) {
                const symbol = this.slotSymbols[i][j];
                
                if (symbol.symbol.anims.isPlaying) {
                    symbol.symbol.anims.stop();
                    symbol.symbol.setTexture(this.updateKeyToZero(symbol.symbol.texture.key));
                }
    
                // Move symbols downward
                this.scene.tweens.add({
                    targets: symbol.symbol,
                    y: symbol.symbol.y + this.maskHeight,
                    alpha: 0,
                    duration: 600,
                    ease: 'Power1',
                    delay: i * 100 // Slight delay between columns
                });
            }
        }
    
        this.moveSlots = true;
        
        this.connectionTimeout = this.scene.time.addEvent({
            delay: 20000,
            callback: this.showDisconnectionScene,
            callbackScope: this
        });
    }

    showDisconnectionScene(){
        Globals.SceneHandler?.addScene("Disconnection", Disconnection, true)
    }
    
    stopTween() {
        for (let i = 0; i < this.reelContainers.length; i++) { 
            this.stopReel(i);   
        }
    }

    stopReel(reelIndex: number) {
        const reelDelay = 300 * (reelIndex + 1);
    
        // Stop any existing reel movement
        if (this.reelTweens[reelIndex]) {
            this.reelTweens[reelIndex].stop();
        }
    
        // For each visible position in the reel
        for (let j = 0; j < this.totalVisibleSymbols; j++) {
            const symbol = this.slotSymbols[reelIndex][j];
            const resultSymbol = ResultData.gameData.resultSymbols[j][reelIndex];
    
            // Set the new symbol texture
            const newTextureKey = resultSymbol === 12 
                ? this.getRandomCowTexture() 
                : `slots${resultSymbol}_0`;
            
            // Position the symbol above the visible area
            symbol.symbol.setTexture(newTextureKey);
            symbol.symbol.y = symbol.startY - this.maskHeight;
            symbol.symbol.alpha = 1;
    
            // Drop animation
            this.scene.tweens.add({
                targets: symbol.symbol,
                y: symbol.startY,
                duration: 600,
                delay: reelDelay + (j * 150), // Stagger the drops
                ease: 'Power1',
                onComplete: () => {
                    // Play appropriate animation after landing
                    if (resultSymbol === 12) {
                        const cowAnimKey = `cowIdle_${reelIndex}_${j}`;
                        if (!this.scene.anims.exists(cowAnimKey)) {
                            this.createCowAnimation(cowAnimKey, this.getRandomCowType());
                        }
                        symbol.symbol.play(cowAnimKey);
                    } else {
                        const symbolAnimKey = `symbol_anim_${resultSymbol}_${reelIndex}_${j}`;
                        if (!this.scene.anims.exists(symbolAnimKey)) {
                            this.createSymbolAnimation(symbolAnimKey, resultSymbol);
                        }
                        symbol.symbol.play(symbolAnimKey);
                    }
    
                    // Check if this is the last symbol of the last reel
                    if (reelIndex === this.reelContainers.length - 1 && 
                        j === this.totalVisibleSymbols - 1) {
                        this.playWinAnimations();
                        this.moveSlots = false;
                        if (!ResultData.gameData.cascading || ResultData.gameData.cascading.length === 0) {
                            this.enableSpinButton();
                        }
                    }
                }
            });
        }
    
        if (this.connectionTimeout) {
            this.connectionTimeout.remove(false);
        }
    }

    playWinAnimations() {
        if (this.isCascading) return; // Add this check
        this.resultCallBack();
        ResultData.gameData.symbolsToEmit.forEach((rowArray: any) => {
            rowArray.forEach((row: any) => {
                if (typeof row === "string") {
                    const [y, x]: number[] = row.split(",").map((value) => parseInt(value));
                    const elementId = ResultData.gameData.resultSymbols[x][y];
    
                    if (this.slotSymbols[y] && this.slotSymbols[y][x]) {
                        this.winMusic("winMusic");
                        this.slotSymbols[y][x].playAnimation(`symbol_anim_${elementId}`);
                    }
                }
            });
        });
    
        // Clear any existing delayed calls
        this.scene.time.removeAllEvents();
        
        // Set up single cascading trigger
        this.scene.time.delayedCall(2500, () => {
            if (!this.isCascading) {
                this.handleCascading();
            }
        });
    }

    winMusic(key: string) {
        if (!this.SoundManager.isSoundPlaying(key)) {
            this.SoundManager.playSound(key);
        }
    }
    stopWinMusic(key: string) {
        if (this.SoundManager.isSoundPlaying(key)) {
            this.SoundManager.stopSound(key);
        }
    }

    private updateKeyToZero(symbolKey: string): string {
        const match = symbolKey.match(/^slots(\d+)_\d+$/);
        if (match) {
            const xValue = match[1];
            return `slots${xValue}_0`;
        }
        return symbolKey;
    }

    private createLaser(startX: number, startY: number, endX: number, endY: number): Promise<void> {
        return new Promise((resolve) => {
            const laser = this.scene.add.graphics();
            const glow = this.scene.add.graphics();
            
            let progress = 0;
            const startWidth = 2;
            const endWidth = 15;
            
            const animateLaser = () => {
                progress += 0.07;
                
                if (progress >= 1) {
                    this.scene.time.delayedCall(200, () => {
                        laser.destroy();
                        glow.destroy();
                        resolve();
                    });
                    return;
                }
    
                // Calculate current end point
                const currentEndX = startX + (endX - startX) * progress;
                const currentEndY = startY + (endY - startY) * progress;
    
                const angle = Phaser.Math.Angle.Between(startX, startY, currentEndX, currentEndY);
    
                laser.clear();
                glow.clear();
    
                const currentEndWidth = startWidth + (endWidth - startWidth) * progress;
                
                // Calculate points for the laser beam
                const points = [
                    startX, startY,
                    currentEndX + Math.cos(angle + Math.PI/2) * currentEndWidth/2,
                    currentEndY + Math.sin(angle + Math.PI/2) * currentEndWidth/2,
                    currentEndX + Math.cos(angle - Math.PI/2) * currentEndWidth/2,
                    currentEndY + Math.sin(angle - Math.PI/2) * currentEndWidth/2
                ];
    
                // Draw glow effect
                glow.fillStyle(0xFFB6C1, 0.3);
                glow.beginPath();
                glow.moveTo(points[0], points[1]);
                glow.lineTo(points[2], points[3]);
                glow.lineTo(points[4], points[5]);
                glow.closePath();
                glow.fill();
    
                // Draw main laser
                laser.fillStyle(0xFFB6C1, 0.7);
                laser.beginPath();
                laser.moveTo(points[0], points[1]);
                laser.lineTo(points[2], points[3]);
                laser.lineTo(points[4], points[5]);
                laser.closePath();
                laser.fill();
    
                this.scene.time.delayedCall(16, animateLaser);
            };
    
            animateLaser();
        });
    }

    async handleCascading() {
        if (!ResultData.gameData.cascading || 
            ResultData.gameData.cascading.length === 0 || 
            this.isCascading) {
            return;
        }
    
        this.isCascading = true;
        this.disableSpinButton(); // Disable at start
        this.scene.time.removeAllEvents(); // Clear any pending events
    
        try {
            for (let cascadeIndex = 0; cascadeIndex < ResultData.gameData.cascading.length; cascadeIndex++) {
                // Stop all existing animations before starting new ones
                this.stopAllAnimations();
                
                await this.processCascadeStep(cascadeIndex);
    
                if (cascadeIndex < ResultData.gameData.cascading.length - 1) {
                    await new Promise(resolve => this.scene.time.delayedCall(1500, resolve));
                }
            }
        } catch (error) {
            // console.error('Error in handleCascading:', error);
        } finally {
            this.isCascading = false;
            this.scene.time.removeAllEvents();
            this.enableSpinButton();
        }
    }
    
    // Add this new method to stop all animations
    private stopAllAnimations() {
        // Stop all symbol animations
        for (let i = 0; i < this.reelContainers.length; i++) {
            for (let j = 0; j < this.slotSymbols[i].length; j++) {
                const symbol = this.slotSymbols[i][j];
                if (symbol.symbol.anims.isPlaying) {
                    symbol.symbol.anims.stop();
                }
            }
        }
    }

    private async processCascadeStep(cascadeIndex: number) {
        return new Promise<void>(async (resolve) => {
            const currentCascade = ResultData.gameData.cascading[cascadeIndex];
            if (!currentCascade) {
                resolve();
                return;
            }
    
            const symbolsToFill = currentCascade.symbolsToFill;
            
            try {
                // Clear any existing animations before starting new ones
                this.stopAllAnimations();
                
                if (currentCascade.winingSymbols && currentCascade.winingSymbols.length > 0) {
                    await this.playBorderBlinkAnimation(currentCascade.winingSymbols);
                }
                await this.playBlastAnimations(symbolsToFill);
                await new Promise(resolve => this.scene.time.delayedCall(300, resolve));
                await this.replaceSymbols(symbolsToFill);
    
                // Update the result symbols
                symbolsToFill.forEach((column, columnIndex) => {
                    if (Array.isArray(column)) {
                        column.forEach((newSymbol, rowIndex) => {
                            if (ResultData.gameData.resultSymbols[rowIndex]) {
                                ResultData.gameData.resultSymbols[rowIndex][columnIndex] = newSymbol;
                            }
                        });
                    }
                });
    
                resolve();
            } catch (error) {
                console.error('Error in processCascadeStep:', error);
                resolve();
            }
        });
    }

    private async playBlastAnimations(symbolsToFill: any[]): Promise<void> {
        return new Promise<void>(async (resolve) => {
            const animationsToPlay = [];
    
            for (let columnIndex = 0; columnIndex < ResultData.gameData.resultSymbols[0].length; columnIndex++) {
                if (symbolsToFill[columnIndex] && symbolsToFill[columnIndex].length > 0) {
                    for (let rowIndex = 0; rowIndex < symbolsToFill[columnIndex].length; rowIndex++) {
                        const currentSymbol = ResultData.gameData.resultSymbols[rowIndex][columnIndex];
                        const newSymbolId = symbolsToFill[columnIndex][rowIndex]; // Get new symbol ID
    
                        // Store animation details
                        animationsToPlay.push({
                            columnIndex,
                            rowIndex,
                            currentSymbol,
                            newSymbolId
                        });
                    }
                }
            }
    
            // Play animations concurrently
            await Promise.all(animationsToPlay.map(async (animData) => {
                if (animData.currentSymbol === 12) {
                    await this.playPullAnimation(animData.columnIndex, animData.rowIndex, animData.newSymbolId);
                } else {
                    await this.playLaserAndBlastAnimation(animData.columnIndex, animData.rowIndex, animData.newSymbolId);
                }
            }));
    
            resolve();
        });
    } 
    
    private playLaserAndBlastAnimation(columnIndex: number, rowIndex: number, newSymbolId: number): Promise<void> {
        return new Promise<void>(async (resolve) => {
            const symbol = this.slotSymbols[columnIndex][rowIndex];
            
            // Find a random UFO that's not above the current column
            let ufoIndex;
            do {
                ufoIndex = Phaser.Math.Between(0, this.ufoSprites.length - 1);
            } while (ufoIndex === columnIndex);
    
            const ufo = this.ufoSprites[ufoIndex];
    
            // Calculate the correct target position
            const targetX = symbol.symbol.x;
            const targetY = symbol.symbol.y - 180; // Adjust this offset based on your layout
    
            // Play laser animation with correct coordinates
            await this.createLaser(
                ufo.x,           // Start X (UFO position)
                ufo.y + 20,      // Start Y (UFO position with slight offset)
                targetX,         // End X (Symbol position)
                targetY         // End Y (Symbol position with adjustment)
            );
    
            // Play blast animation at the correct position
            const blastSprite = this.scene.add.sprite(targetX, targetY, 'blast_0')
                .setScale(0.75)
                .setDepth(20);
    
            if (!this.scene.anims.exists('blast')) {
                this.scene.anims.create({
                    key: 'blast',
                    frames: Array.from({ length: 30 }, (_, i) => ({ key: `blast_${i}` })),
                    frameRate: 20,
                    repeat: 0
                });
            }
    
            symbol.symbol.setAlpha(0);
            blastSprite.play('blast');
            blastSprite.on('animationcomplete', () => {
                blastSprite.destroy();
                resolve();
            });
        });
    }
    
    private playPullAnimation(columnIndex: number, rowIndex: number, newSymbolId: number): Promise<void> {
        return new Promise<void>((resolve) => {
            const symbol = this.slotSymbols[columnIndex][rowIndex];
            const ufo = this.ufoSprites[columnIndex];
    
            const newSymbolId = ResultData.gameData.cascading[0].symbolsToFill[columnIndex][rowIndex];
    
            // Adjust distance calculation for proper Y positioning
            const distance = Math.abs((ufo.y + 20) - (symbol.symbol.y - 180));
            
            if (!this.scene.anims.exists(`pullAnimation_${rowIndex}`)) {
                const frameConfigs = Array.from({ length: 18 }, (_, i) => ({
                    key: `pullAnim${i}`,
                    scaleY: distance / this.scene.textures.getFrame('pullAnim0').height
                }));
    
                this.scene.anims.create({
                    key: `pullAnimation_${rowIndex}`,
                    frames: frameConfigs,
                    frameRate: 20,
                    repeat: 0
                });
            }
    
            const pullSprite = this.scene.add.sprite(ufo.x, ufo.y + 20, 'pullAnim0')
                .setOrigin(0.5, 0)
                .setDepth(15); 
    
            const scaleY = distance / this.scene.textures.getFrame('pullAnim0').height;
            pullSprite.setScale(0.45, scaleY);
    
            symbol.symbol.setAlpha(0);
            pullSprite.play(`pullAnimation_${rowIndex}`);
    
            // Adjust the tween animation for proper Y positioning
            this.scene.tweens.add({
                targets: symbol.symbol,
                x: ufo.x,
                y: ufo.y - 180, // Adjust Y position
                scaleX: 0.3,
                scaleY: 0.3,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    const newSymbolTexture = newSymbolId === 12
                    ? this.getRandomCowTexture()
                    : `slots${newSymbolId}_0`;

                    // Reset symbol properties and set the new texture
                    symbol.symbol
                        .setTexture(newSymbolTexture)
                        .setScale(0.75)
                        .setPosition(symbol.startX, symbol.startY); // Set to correct initial position

                }
            });
    
            pullSprite.on('animationcomplete', () => {
                pullSprite.destroy();
                resolve();
            });
        });
    }

    private getRandomCowType(): string {
        const cowTypes = ['blackCow', 'brownCow', 'whiteCow'];
        return cowTypes[Phaser.Math.Between(0, cowTypes.length - 1)];
    }
    
    private getRandomCowTexture(): string {
        return `${this.getRandomCowType()}12_0`;
    }
    
    private createCowAnimation(key: string, cowType: string) {
        this.scene.anims.create({
            key: key,
            frames: Array.from({ length: 11 }, (_, i) => ({
                key: `${cowType}12_${i}`
            })),
            frameRate: 10,
            repeat: -1
        });
    }
    
    private createSymbolAnimation(key: string, symbolId: number) {
        this.scene.anims.create({
            key: key,
            frames: Array.from({ length: 13 }, (_, i) => ({
                key: `slots${symbolId}_${i}`
            })),
            frameRate: 20,
            repeat: -1
        });
    }
    private replaceSymbols(symbolsToFill: any[]): Promise<void[]> {
        const promises: Promise<void>[] = [];
    
        symbolsToFill.forEach((column, columnIndex) => {
            if (Array.isArray(column)) {
                column.forEach((newSymbolId, rowIndex) => {
                    const symbol = this.slotSymbols[columnIndex][rowIndex];
                    
                    // Reset symbol properties
                    symbol.symbol.setAlpha(1);
                    const originalY = symbol.symbol.y;
                    symbol.symbol.y -= this.spacingY * 2;
    
                    const promise = new Promise<void>((resolve) => {
                        this.scene.tweens.add({
                            targets: symbol.symbol,
                            y: originalY,
                            duration: 500,
                            ease: 'Bounce.easeOut',
                            delay: rowIndex * 100,
                            onComplete: () => {
                                if (newSymbolId === 12) {
                                    // Handle cow symbols
                                    const cowVariations = ['blackCow', 'brownCow', 'whiteCow'];
                                    const randomCowType = cowVariations[Phaser.Math.Between(0, cowVariations.length - 1)];
                                    const baseTexture = `${randomCowType}12_0`;
                                    symbol.symbol.setTexture(baseTexture);
    
                                    const cowAnimKey = `${randomCowType}Idle_${columnIndex}_${rowIndex}`;
                                    if (!this.scene.anims.exists(cowAnimKey)) {
                                        this.scene.anims.create({
                                            key: cowAnimKey,
                                            frames: Array.from({ length: 11 }, (_, i) => ({
                                                key: `${randomCowType}12_${i}`
                                            })),
                                            frameRate: 10,
                                            repeat: 1
                                        });
                                    }
                                    symbol.symbol.play(cowAnimKey);
                                } else {
                                    // Handle regular symbols
                                    const newTextureKey = `slots${newSymbolId}_0`;
                                    symbol.symbol.setTexture(newTextureKey);
                                    
                                    const animKey = `symbol_anim_${newSymbolId}_${columnIndex}_${rowIndex}`;
                                    if (!this.scene.anims.exists(animKey)) {
                                        const textureKeys = Array.from({ length: 13 }, (_, i) => `slots${newSymbolId}_${i}`);
                                        this.scene.anims.create({
                                            key: animKey,
                                            frames: textureKeys.map(key => ({ key })),
                                            frameRate: 20,
                                            repeat: -1
                                        });
                                    }
                                    symbol.symbol.play(animKey);
                                }
                                resolve();
                            }
                        });
                    });
                    promises.push(promise);
                });
            }
        });
    
        return Promise.all(promises);
    }

    private createUFOs() {
        // Create UFO animation if it doesn't exist
        if (!this.scene.anims.exists('ufoAnimation')) {
            const ufoFrames = Array.from({ length: 16 }, (_, i) => ({ key: `ufo${i}` }));
            this.scene.anims.create({
                key: 'ufoAnimation',
                frames: ufoFrames,
                frameRate: 15,
                repeat: -1
            });
        }
    
        // Different configurations for each UFO
        const ufoConfigs = [
            { bounceHeight: 25, duration: 1200, delay: 0, cowSprite: 'cow1_0' },     // First UFO
            { bounceHeight: 30, duration: 1500, delay: 300, cowSprite: 'cow2_0' },   // Second UFO
            { bounceHeight: 20, duration: 1000, delay: 600, cowSprite: 'cow3_0' },   // Third UFO
            { bounceHeight: 35, duration: 1300, delay: 900, cowSprite: 'cow4_0' },   // Fourth UFO
            { bounceHeight: 27, duration: 1400, delay: 1200, cowSprite: 'cow5_0' }   // Fifth UFO
        ];
    
        // Calculate positions based on reel positions
        for (let i = 0; i < 5; i++) {
            const reelX = this.slotSymbols[i][0].symbol.x;
            const reelY = this.slotSymbols[i][0].symbol.y;
            const config = ufoConfigs[i];
    
            // Create UFO sprite above the reel
            const ufo = this.scene.add.sprite(reelX, reelY - 350, 'ufo0')
                .setScale(0.2);

            const cow = this.scene.add.sprite(reelX-5, reelY-395, config.cowSprite) // Adjust Y offset as needed
            .setScale(0.25); // Adjust scale as needed
    
            // Main bounce animation
            this.scene.tweens.add({
                targets: [ufo, cow],
                y: `+=${config.bounceHeight}`,
                duration: config.duration,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: config.delay
            });
            // Play UFO frame animation with different speeds
            ufo.play({
                key: 'ufoAnimation',
                frameRate: 15 + i, // Slightly different speeds for each UFO
                repeat: -1
            });
    
            // Store UFO reference
            this.ufoSprites.push(ufo);
            
            // Add to the scene but outside the mask
            this.add(ufo);
        }
    }

    updateUFOPositions() {
        this.ufoSprites.forEach((ufo, index) => {
            const reelX = this.slotSymbols[index][0].symbol.x;
            const reelY = this.slotSymbols[index][0].symbol.y;
            ufo.x = reelX;
            // Keep the Y position relative to the current bounce animation
        });
    }

    // Optional: Add method to stop/start UFO animations
    toggleUFOAnimations(play: boolean) {
        this.ufoSprites.forEach(ufo => {
            if (play) {
                ufo.play('ufoAnimation');
            } else {
                ufo.stop();
            }
        });
    }

    private createBorderAnimation(x: number, y: number): Phaser.GameObjects.Graphics {
        const border = this.scene.add.graphics();
        const symbol = this.slotSymbols[x][y].symbol;
        const padding = 5; // Adjust padding as needed
        const borderWidth = 10; // Adjust border width as needed
        const cornerRadius = 10; // Radius for rounded corners
    
        border.lineStyle(borderWidth, 0x8B4513); // Brown color
    
        // Calculate rectangle dimensions
        const rect = {
            x: symbol.x - (symbol.displayWidth / 2) - padding,
            y: symbol.y - (symbol.displayHeight / 2) - padding - 180,
            width: symbol.displayWidth + (padding * 2),
            height: symbol.displayHeight + (padding * 2)
        };
    
        // Draw rounded rectangle
        border.beginPath();
        border.moveTo(rect.x + cornerRadius, rect.y);
        border.lineTo(rect.x + rect.width - cornerRadius, rect.y);
        border.arc(rect.x + rect.width - cornerRadius, rect.y + cornerRadius, cornerRadius, -Math.PI/2, 0);
        border.lineTo(rect.x + rect.width, rect.y + rect.height - cornerRadius);
        border.arc(rect.x + rect.width - cornerRadius, rect.y + rect.height - cornerRadius, cornerRadius, 0, Math.PI/2);
        border.lineTo(rect.x + cornerRadius, rect.y + rect.height);
        border.arc(rect.x + cornerRadius, rect.y + rect.height - cornerRadius, cornerRadius, Math.PI/2, Math.PI);
        border.lineTo(rect.x, rect.y + cornerRadius);
        border.arc(rect.x + cornerRadius, rect.y + cornerRadius, cornerRadius, Math.PI, -Math.PI/2);
        border.closePath();
        border.strokePath();
        
        return border;
    }

    private async playBorderBlinkAnimation(winningSymbolsArray: string[][]): Promise<void> {
        return new Promise<void>((resolve) => {
            const borders: Phaser.GameObjects.Graphics[] = [];
            
            // Flatten the array of arrays and create borders for all winning symbols
            winningSymbolsArray.forEach(winningSymbols => {
                winningSymbols.forEach(symbolPos => {
                    const [y, x] = symbolPos.split(',').map(Number); // Swapped x and y here
                    const border = this.createBorderAnimation(y, x);
                    borders.push(border);
                });
            });
    
            let blinkCount = 0;
            const totalBlinks = 3;
            const blinkDuration = 300; // Duration for each blink (on/off)
    
            const blink = () => {
                borders.forEach(border => {
                    border.setVisible(!border.visible);
                });
    
                blinkCount++;
                if (blinkCount < totalBlinks * 2) { // * 2 because each blink needs on and off
                    this.scene.time.delayedCall(blinkDuration, blink);
                } else {
                    // Clean up borders after blinking
                    borders.forEach(border => border.destroy());
                    // Wait 1 second after blinking before resolving
                    this.scene.time.delayedCall(1000, resolve);
                }
            };
    
            // Start blinking
            blink();
        });
    }

    private disableSpinButton() {
        if (this.uiContainer && this.uiContainer.spinBtn) {
            this.uiContainer.spinBtn.setTexture("spinBtnOnPressed");
            this.uiContainer.spinBtn.disableInteractive();
        }
    }
    
    private enableSpinButton() {
        console.log("check retrun");
        
        if (this.uiContainer && this.uiContainer.spinBtn) {
            this.uiContainer.spinBtn.setTexture("spinBtn");
            this.uiContainer.spinBtn.setInteractive();
        }
    }
}

// @Sybols CLass
class Symbols {
    symbol: Phaser.GameObjects.Sprite;
    startY: number = 0;
    startX: number = 0;
    startMoving: boolean = false;
    index: { x: number; y: number };
    totalSymbol : number = 4;
    visibleSymbol: number = 3;
    startIndex: number = 1;
    spacingY : number = 204;
    scene: Phaser.Scene;
    private isMobile: boolean;
    reelContainer: Phaser.GameObjects.Container
    private bouncingTween: Phaser.Tweens.Tween | null = null;
    winningSprite: Phaser.GameObjects.Sprite | null = null; 
    constructor(scene: Phaser.Scene, symbolKey: string, index: { x: number; y: number }, reelContainer: Phaser.GameObjects.Container) {
        this.scene = scene;
        this.index = index;
        this.reelContainer = reelContainer
        const updatedSymbolKey = this.updateKeyToZero(symbolKey)
        this.symbol = new Phaser.GameObjects.Sprite(scene, 0, 0, updatedSymbolKey);
        this.symbol.setOrigin(0.5, 0.5);
        this.isMobile = scene.sys.game.device.os.android || scene.sys.game.device.os.iOS;
        // Load textures and create animation
        const textures: string[] = [];
        for (let i = 0; i < 13; i++) {
            textures.push(`${symbolKey}`);
        }  
        // console.log(textures, "textures");
              
        this.scene.anims.create({
            key: `${symbolKey}`,
            frames: textures.map((texture) => ({ key: texture })),
            frameRate: 10,
            repeat: -1,
        });        
    }

    // to update the slotx_0 to show the 0 index image at the end
    updateKeyToZero(symbolKey: string): string {
        const match = symbolKey.match(/^slots(\d+)_\d+$/);
        if (match) {
            const xValue = match[1];
            return `slots${xValue}_0`;
        } else {
            return symbolKey; // Return the original key if format is incorrect
        }
    }
    playAnimation(animationId: any) {
       this.symbol.play(animationId)
    }
    stopAnimation() {
        if (this.symbol.anims.isPlaying) {
            this.symbol.anims.stop();
        } 
    }
    endTween() {
        if (this.index.y < 3) {
            const elementId = ResultData.gameData.resultSymbols[this.index.y][this.index.x];
            if (typeof elementId === 'undefined') {
                console.error('Invalid index access:', this.index.y, this.index.x);
                return;
            }
    
            if (elementId === 12) {
                // Handle cow symbols
                const cowVariations = ['blackCow', 'brownCow', 'whiteCow'];
                const randomCowType = cowVariations[Phaser.Math.Between(0, cowVariations.length - 1)];
                const baseTexture = `${randomCowType}12_0`;
                
                this.symbol.setTexture(baseTexture);
                
                // Create and play cow animation
                const cowAnimKey = `${randomCowType}Idle_${this.index.x}_${this.index.y}`;
                if (!this.scene.anims.exists(cowAnimKey)) {
                    this.scene.anims.create({
                        key: cowAnimKey,
                        frames: Array.from({ length: 11 }, (_, i) => ({
                            key: `${randomCowType}12_${i}`
                        })),
                        frameRate: 10,
                        repeat: 1
                    });
                }
                // this.symbol.play(cowAnimKey);
            } else {
                // Handle regular symbols
                let textureKeys: string[] = [];
                for (let i = 0; i < 13; i++) {
                    const textureKey = `slots${elementId}_${i}`;
                    if (this.scene.textures.exists(textureKey)) {
                        textureKeys.push(textureKey);
                    }
                }
    
                if (textureKeys.length > 0) {
                    const animKey = `symbol_anim_${elementId}_${this.index.x}_${this.index.y}`;
                    if (!this.scene.anims.exists(animKey)) {
                        this.scene.anims.create({
                            key: animKey,
                            frames: textureKeys.map(key => ({ key })),
                            frameRate: 20,
                            repeat: -1
                        });
                    }
                    this.symbol.setTexture(textureKeys[0]);
                    this.symbol.play(animKey);
                }
            }
            this.startMoving = true;
        }
    
        this.scene.time.delayedCall(10, () => {
            this.startMoving = false;
        });
    }
}