import Phaser from 'phaser';
import { Scene, GameObjects, Types } from 'phaser';
import { Globals, ResultData, currentGameData, initData } from './Globals';
import { TextLabel } from './TextLabel';
import { gameConfig } from './appconfig';
import SoundManager from './SoundManager';
// Define UiContainer as a Phaser Scene class
export class UiContainer extends Phaser.GameObjects.Container {
    SoundManager: SoundManager
    spinBtn!: Phaser.GameObjects.Sprite;
    autoBetBtn!: Phaser.GameObjects.Sprite;
    CurrentBetText!: TextLabel;
    currentWiningText!: TextLabel;
    WiningText!: Phaser.GameObjects.Text;
    currentBalanceText!: TextLabel;
    CurrentLineText!: TextLabel;
    pBtn!: Phaser.GameObjects.Sprite;
    mBtn!: Phaser.GameObjects.Sprite;
    linesNumber!: Phaser.GameObjects.Sprite;
    insideLine!: Phaser.GameObjects.Sprite
    fadeDoubbleButton!: Phaser.GameObjects.Sprite;
    exitBtn!: Phaser.GameObjects.Sprite
    insideText!: Phaser.GameObjects.Text;
    public isAutoSpinning: boolean = false; // Flag to track if auto-spin is active
    betButtonDisable!: Phaser.GameObjects.Container
    private winTween: Phaser.Tweens.Tween | null = null; // Store the win tween
    totalLines = 0

    constructor(scene: Scene, spinCallBack: () => void, soundManager: SoundManager) {
        super(scene);
        scene.add.existing(this); 
        // Initialize UI elements
        // this.maxBetInit();
        this.spinBtnInit(spinCallBack);
        this.autoSpinBtnInit(spinCallBack);
        this.lineBtnInit();
        this.winBtnInit();
        this.balanceBtnInit();
        this.BetBtnInit();  ``
        this.linesNumberInit();
        this.smallLine();
        this.SoundManager = soundManager;
        this.totalLines = initData.gameData.linesApiData.length
    }

    /**
     * @method lineBtnInit Shows the number of lines for example 1 to 20
     */
    lineBtnInit() { 
        const container = this.scene.add.container(0, 0);
        const linePanel = this.scene.add.sprite(0, 0, "lines").setDepth(0).setScale(0.7, 0.85);
        linePanel.setOrigin(0.5);
        linePanel.setPosition(gameConfig.scale.width * 0.4, gameConfig.scale.height * 0.91);
        const linePanelText = this.scene.add.text(linePanel.x - 20, linePanel.y + 50, "Bets/Line", {fontFamily:"Anton", fontSize: "25px", color: "#d2bd6a"}).setOrigin(0.5)
        // container.add(lineText);
        this.pBtn = this.createButton('pBtn', gameConfig.scale.width * 0.435, gameConfig.scale.height * 0.89, () => {
            this.buttonMusic("buttonpressed");
            this.pBtn.setTexture('pBtnH');
            this.pBtn.disableInteractive();
            if (!currentGameData.isMoving) {
                currentGameData.currentBetIndex++;
                if (currentGameData.currentBetIndex >= initData.gameData.Bets.length) {
                    currentGameData.currentBetIndex = 0;
                }
                const betAmount = initData.gameData.Bets[currentGameData.currentBetIndex];
                
                const updatedBetAmount = betAmount * initData.gameData.linesApiData.length;
                this.CurrentLineText.updateLabelText(betAmount);
                this.CurrentBetText.updateLabelText(updatedBetAmount.toFixed(2).toString());
                this.updateInsideText();
            }
            this.scene.time.delayedCall(200, () => {
                this.pBtn.setTexture('pBtn');
                this.pBtn.setInteractive({ useHandCursor: true, pixelPerfect: true });
            });
        }).setDepth(8);
        this.pBtn.setScale(0.6);
        this.mBtn = this.createButton('mBtn', gameConfig.scale.width * 0.435, gameConfig.scale.height * 0.92, ()=>{
            this.buttonMusic("buttonpressed");
            this.mBtn.setTexture('mBtnH');
            this.mBtn.disableInteractive();
            if (!currentGameData.isMoving) {
                currentGameData.currentBetIndex--;
                if (currentGameData.currentBetIndex <= 0) {
                    currentGameData.currentBetIndex = 0;
                }
                const betAmount = initData.gameData.Bets[currentGameData.currentBetIndex];
                const updatedBetAmount = betAmount * this.totalLines;
                this.CurrentLineText.updateLabelText(betAmount);
                this.CurrentBetText.updateLabelText(updatedBetAmount.toFixed(2).toString());
                this.updateInsideText();
            }
            this.scene.time.delayedCall(200, () => {
                this.mBtn.setTexture('mBtn');
                this.mBtn.setInteractive({ useHandCursor: true, pixelPerfect: true });
            });
        })
        this.mBtn.setScale(0.6);
        container.add([this.pBtn, this.mBtn]);
        this.CurrentLineText = new TextLabel(this.scene, linePanel.x-30, linePanel.y, initData.gameData.Bets[currentGameData.currentBetIndex], 35, "#ffffff").setOrigin(0.5)
        //Line Count
        container.add(this.CurrentLineText).setDepth(1)
    }

    /**
     * @method winBtnInit add sprite and text
     * @description add the sprite/Placeholder and text for winning amount 
     */
    winBtnInit() {
        const winPanel = this.scene.add.sprite(gameConfig.scale.width * 0.76, gameConfig.scale.height * 0.88, 'winPanel').setScale(0.85)
        const currentWining: any = ResultData.playerData.currentWining.toFixed(2);
        this.currentWiningText = new TextLabel(this.scene, winPanel.x, winPanel.y, currentWining, 40, "#ffffff");
        this.WiningText = this.scene.add.text(winPanel.x, winPanel.y + 80, "Win", {fontFamily:"Anton", fontSize: "25px", color: "#d2bd6a"}).setOrigin(0.5)
        // const winPanelChild = this.scene.add.container(winPanel.x, winPanel.y)
        this.add([ winPanel, this.currentWiningText, this.WiningText]);
    }

    /**
     * @method balanceBtnInit Remaning balance after bet (total)
     * @description added the sprite/placeholder and Text for Total Balance 
     */
    balanceBtnInit() {
        const balancePanel = this.scene.add.sprite(0, 0, 'balanceBox').setScale(0.7, 0.85);
        balancePanel.setOrigin(0.5);
        balancePanel.setPosition(gameConfig.scale.width * 0.62, gameConfig.scale.height * 0.91);
        const container = this.scene.add.container(balancePanel.x, balancePanel.y);
        // container.add(balancePanel);
        currentGameData.currentBalance = initData.playerData.Balance;
        const balanceText = this.scene.add.text(0, 50, "Balance", {fontFamily:"Anton", fontSize: "25px", color: "#d2bd6a"}).setOrigin(0.5)
        this.currentBalanceText = new TextLabel(this.scene, 0, 0, currentGameData.currentBalance.toFixed(2).toString(), 35, "#ffffff").setOrigin(0.5);
        container.add([this.currentBalanceText, balanceText]);
    }
    /**
     * @method spinBtnInit Spin the reel
     * @description this method is used for creating and spin button and on button click the a SPIn emit will be triggered to socket and will deduct the amout according to the bet
     */
    spinBtnInit(spinCallBack: () => void) {
        this.spinBtn = new Phaser.GameObjects.Sprite(this.scene, 0, 0, "spinBtn");
        this.spinBtn = this.createButton('spinBtn', gameConfig.scale.width * 0.86, gameConfig.scale.height * 0.89, () => {
            
            if(ResultData.playerData.Balance < initData.gameData.Bets[currentGameData.currentBetIndex]){
                this.lowBalancePopup();
                return
            }
                this.buttonMusic("spinButton");
                this.onSpin(true);
        
            // checking if autoSpining is working or not if it is auto Spining then stop it
            if(this.isAutoSpinning){
                this.autoBetBtn.emit('pointerdown'); // Simulate the pointerdown event
                this.autoBetBtn.emit('pointerup'); // Simulate the pointerup event (if needed)
                return;
            }
        // tween added to scale transition
            this.scene.tweens.add({
                targets: this.spinBtn,
                duration: 100,
                onComplete: () => {
                    this.insideText.setText("GOOD LUCK")
                    // Send message and update the balance
                    Globals.Socket?.sendMessage("SPIN", { currentBet: currentGameData.currentBetIndex, currentLines: initData.gameData.linesApiData.length, spins: 1 });
                    currentGameData.currentBalance -= (initData.gameData.Bets[currentGameData.currentBetIndex] * this.totalLines);
                    this.currentBalanceText.updateLabelText(currentGameData.currentBalance.toFixed(2));
                    // Trigger the spin callback
                    spinCallBack();
                }
            });
        }).setDepth(1);
    }

    smallLine(){
        this.insideLine = this.scene.add.sprite(gameConfig.scale.width * 0.4, gameConfig.scale.height * 0.845, "insideLine").setOrigin(0.5).setScale(0.9)
        this.insideText = this.scene.add.text(gameConfig.scale.width * 0.4, gameConfig.scale.height * 0.845, `TOTAL LINESS: ${initData.gameData.linesApiData.length} X BET PER LINE: ${initData.gameData.Bets[currentGameData.currentBetIndex]} = TOTAL BET = ${initData.gameData.Bets[currentGameData.currentBetIndex]* initData.gameData.linesApiData.length}`, {fontFamily:"Anton", fontSize: "30px", color: "#ffffff"}).setOrigin(0.5)
    }

    updateInsideText() {
        const betAmount = initData.gameData.Bets[currentGameData.currentBetIndex];
        const totalBet = betAmount * initData.gameData.linesApiData.length;
        this.insideText.setText(`TOTAL LINES: ${this.totalLines} X BET PER LINE: ${betAmount} = TOTAL BET = ${totalBet}`);
    }
    /**
     * @method autoSpinBtnInit 
     * @param spinCallBack 
     * @description crete and auto spin button and on that spin button click it change the sprite and called a recursive function and update the balance accroding to that
     */
    autoSpinBtnInit(spinCallBack: () => void) {
        this.autoBetBtn = new Phaser.GameObjects.Sprite(this.scene, 0, 0, "autoSpin");
        this.autoBetBtn = this.createButton(
            'autoSpin',
            gameConfig.scale.width * 0.24,
            gameConfig.scale.height * 0.92,
            () => {
                // this.normalButtonSound.play()
                this.scene.tweens.add({
                    targets: this.autoBetBtn,
                    duration: 100,
                    onComplete: () =>{
                        this.isAutoSpinning = !this.isAutoSpinning; // Toggle auto-spin state
                        if (this.isAutoSpinning && currentGameData.currentBalance > (initData.gameData.Bets[currentGameData.currentBetIndex]*initData.gameData.linesApiData.length)) {
                            Globals.Socket?.sendMessage("SPIN", {
                                currentBet: currentGameData.currentBetIndex,
                                currentLines : initData.gameData.linesApiData.length
                            });
                            currentGameData.currentBalance -= (initData.gameData.Bets[currentGameData.currentBetIndex] * initData.gameData.linesApiData.length);
                            spinCallBack(); // Callback to indicate the spin has started
                            // this.currentBalanceText.updateLabelText(currentGameData.currentBalance.toFixed(2));
                            this.autoSpinRec(true)
                            // Start the spin recursion
                            setTimeout(() => {
                                this.startSpinRecursion(spinCallBack);
                            }, 500);
                        } else {
                            // Stop the spin if auto-spin is turned off
                            this.autoSpinRec(false);
                        }
                    }
                })
            }
        ).setDepth(0);
        this.autoBetBtn.setScale(0.45)
    }
    /**
     * @method BetBtnInit 
     * @description this method is used to create the bet Button which will show the totla bet which is placed and also the plus and minus button to increase and decrese the bet value
     */
    BetBtnInit() {
        const container = this.scene.add.container(gameConfig.scale.width * 0.5, gameConfig.scale.height * 0.91);
        this.betButtonDisable = container;
        const betPanelHeading = this.scene.add.text(0, 50, "Total Bet", {fontFamily:"Anton", fontSize: "25px", color: "#d2bd6a"}).setOrigin(0.5)
        const betPanel = this.scene.add.sprite(0, 0, 'boxPanel').setOrigin(0.5).setDepth(4).setScale(0.9);
        container.add(betPanel);
        this.CurrentBetText = new TextLabel(this.scene, 0, 0, ((initData.gameData.Bets[currentGameData.currentBetIndex]) * initData.gameData.linesApiData.length).toFixed(2).toString(), 35, "#ffffff").setDepth(6);
        container.add([betPanelHeading, this.CurrentBetText]);
    }
    linesNumberInit(){
        this.linesNumber = this.scene.add.sprite(gameConfig.scale.width * 0.31, gameConfig.scale.height * 0.91 , "boxPanel").setOrigin(0.5).setScale(0.8)
        const totalLines = this.scene.add.text(gameConfig.scale.width * 0.31, gameConfig.scale.height * 0.91, initData.gameData.linesApiData.length.toString(), {fontFamily:"RobotoCondensed", fontSize: "35px", color: "#ffffff"}).setOrigin(0.5)
        const lineText = this.scene.add.text(gameConfig.scale.width * 0.31, totalLines.y + 50, "Lines", {fontFamily:"Anton", fontSize: "25px", color: "#d2bd6a"}).setOrigin(0.5)
    }
   
    /**
     * @method startSpinRecursion
     * @param spinCallBack 
     */
    startSpinRecursion(spinCallBack: () => void) {
        if (this.isAutoSpinning && currentGameData.currentBalance > 0) {
        
            const delayAuto = (ResultData.gameData.cascading.length > 0) ? (ResultData.gameData.cascading.length == 1) ? 12000 : ResultData.gameData.cascading.length * 10000 : 5000
                this.scene.time.delayedCall(delayAuto, () => {
                if (this.isAutoSpinning && currentGameData.currentBalance >= 0) {
                    Globals.Socket?.sendMessage("SPIN", {
                        currentBet: currentGameData.currentBetIndex,
                        currentLines : initData.gameData.linesApiData.length
                    });
                    currentGameData.currentBalance -= (initData.gameData.Bets[currentGameData.currentBetIndex] * initData.gameData.linesApiData.length);
                    // this.currentBalanceText.updateLabelText(currentGameData.currentBalance.toFixed(2));
                    spinCallBack();
                    // Call the spin recursively
                    this.spinRecursively(spinCallBack);
                }
            });
        }
    }

    spinRecursively(spinCallBack: () => void) {
        if (this.isAutoSpinning) {
            // Perform the spin
            this.autoSpinRec(true);
            if (currentGameData.currentBalance < (initData.gameData.Bets[currentGameData.currentBetIndex]*initData.gameData.linesApiData.length)) {
                this.autoSpinRec(false);
                spinCallBack();
            } else {
                setTimeout(() => {
                    this.startSpinRecursion(spinCallBack);
                }, 500);
            }
        }
    }
    
    createButton(key: string, x: number, y: number, callback: () => void): Phaser.GameObjects.Sprite {
        const button = this.scene.add.sprite(x, y, key).setInteractive({ useHandCursor: true, pixelPerfect: true });
        button.on('pointerdown', callback);
        return button;
    }
   
    autoSpinRec(spin: boolean){        
        if(spin){
            this.spinBtn.setTexture("spinBtn");
            this.autoBetBtn.setTexture("autoSpin");
            this.pBtn.disableInteractive();
            this.pBtn.setTexture("pBtnH")
            this.autoBetBtn.setAlpha(0.5)
        }else{
            this.spinBtn.setTexture("spinBtn");
            this.autoBetBtn.setTexture("autoSpin");
            this.pBtn.setInteractive({ useHandCursor: true, pixelPerfect: true });
            this.autoBetBtn.setAlpha(1)
            this.pBtn.setTexture("pBtn")           
        }        
    }

    onSpin(spin: boolean) {
        // Handle spin functionality
        // console.error("cececfeve", spin)
        if(this.isAutoSpinning){
            return
        }
        if(spin){
            this.spinBtn.setTexture("spinBtnOnPressed");
            this.spinBtn.disableInteractive();
            this.autoBetBtn.setTexture("autoSpinOnPressed")
            this.autoBetBtn.disableInteractive();
            this.pBtn.disableInteractive();
            this.pBtn.setTexture("pBtnH")
            
        }else{
            this.spinBtn.setTexture("spinBtn");
            this.spinBtn.setInteractive({ useHandCursor: true, pixelPerfect: true });
            this.autoBetBtn.setTexture("autoSpin");
            this.autoBetBtn.setInteractive({ useHandCursor: true, pixelPerfect: true });
            this.pBtn.setTexture("pBtn");
            this.pBtn.setInteractive({ useHandCursor: true, pixelPerfect: true });
           
            // this.spinBtn.setAlpha(1)
            // this.autoBetBtn.setAlpha(1)
        }        
    }

    lowBalancePopup(){
        // Create a semi-transparent background for the popup
        const blurGraphic = this.scene.add.graphics().setDepth(1); // Set depth lower than popup elements
        blurGraphic.fillStyle(0x000000, 0.5); // Black with 50% opacity
        blurGraphic.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height); // Cover entire screen
    
        // Create a container for the popup
        const popupContainer = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2
        ).setDepth(1); // Set depth higher than blurGraphic
    
        // Popup background image
        const popupBg = this.scene.add.image(0, 0, 'messagePopup').setDepth(10);
        popupBg.setOrigin(0.5);
        popupBg.setDisplaySize(900, 671); // Set the size for your popup background
        popupBg.setAlpha(1); // Set background transparency
   
        this.exitBtn = this.createButton('infoCross', 420, -310, () => { 
            popupContainer.destroy();
            blurGraphic.destroy(); // Destroy blurGraphic when popup is closed
            this.buttonMusic("buttonpressed");
        })
        this.exitBtn.setScale(0.6)
        // Add text to the popup
        const popupText = this.scene.add.text(0, 0, "Your account balance is running low. Please add funds to keep continue.", {color:"#ffffff", fontSize: "40px", fontFamily: 'Anton', align:"center",wordWrap: { width: 600, useAdvancedWrap: true }}).setOrigin(0.5);
      
      
        // Add all elements to popupContainer
        popupContainer.add([popupBg, popupText,this.exitBtn]);
        // Add popupContainer to the scene
        this.scene.add.existing(popupContainer);  
    }

    buttonMusic(key: string){
        this.SoundManager.playSound(key)
    }
    update() {
        
    }
    
}
