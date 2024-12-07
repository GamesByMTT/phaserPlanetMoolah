import { Scene } from 'phaser';
import { Slots } from '../scripts/Slots';
import { UiContainer } from '../scripts/UiContainer';
import { LineGenerator } from '../scripts/Lines';
import { UiPopups } from '../scripts/UiPopup';
import LineSymbols from '../scripts/LineSymbols';
import { 
    Globals, 
    ResultData, 
    currentGameData, 
    initData, 
} from '../scripts/Globals';
import { gameConfig } from '../scripts/appconfig';
import SoundManager from '../scripts/SoundManager';

export default class MainScene extends Scene {
    // Declare properties without explicit initialization
    gameBg!: Phaser.GameObjects.Sprite;
    reelBg!: Phaser.GameObjects.Sprite;
    top!: Phaser.GameObjects.Sprite;
    bottom!: Phaser.GameObjects.Sprite;
    left!: Phaser.GameObjects.Sprite;
    right!: Phaser.GameObjects.Sprite;
    rope!: Phaser.GameObjects.Sprite;
    nail!: Phaser.GameObjects.Sprite
    middleBar!: Phaser.GameObjects.Sprite;
    gameLogo!: Phaser.GameObjects.Sprite;
    slot!: Slots;
    lineGenerator!: LineGenerator;
    soundManager!: SoundManager;
    uiContainer!: UiContainer;
    uiPopups!: UiPopups;    
    lineSymbols!: LineSymbols;
    rightPin!: Phaser.GameObjects.Sprite;
    leftPin!: Phaser.GameObjects.Sprite
    private mainContainer!: Phaser.GameObjects.Container;
    private freeSpinInterval: NodeJS.Timeout | null = null;

    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Container for better organization and potential performance
        this.mainContainer = this.add.container();

        this.soundManager = new SoundManager(this);
        this.uiContainer = new UiContainer(this, () => this.onSpinCallBack(), this.soundManager);
        this.gameBg = this.add.sprite(width / 2, height / 2, 'gameBg')
            .setDepth(0)
            .setDisplaySize(1920, 1080);
        this.reelBg = this.add.sprite(width/2, height/1.98, "reelBg").setOrigin(0.5).setDepth(3)
        // this.gameLogo = this.add.sprite(width * 0.5, height * 0.08, "gameLogo").setOrigin(0.5).setDepth(3)
        this.bottom = this.add.sprite(width * 0.5, height * 0.89, "bottomLayer").setOrigin(0.5).setScale(0.9);
        // this.rightPin = this.add.sprite(gameConfig.scale.width * 0.8, gameConfig.scale.height/1.9, "rightPin").setOrigin(0.5)
        // this.leftPin = this.add.sprite(gameConfig.scale.width * 0.2, gameConfig.scale.height/1.9, "leftPin").setOrigin(0.5) 
        this.mainContainer.add([this.gameBg, this.reelBg, this.bottom]);
        this.soundManager.playSound("backgroundMusic");

        
        this.mainContainer.add(this.uiContainer);

        this.slot = new Slots(this, this.uiContainer, () => this.onResultCallBack(), this.soundManager);
        this.lineGenerator = new LineGenerator(this, this.slot.slotSymbols[0][0].symbol.height, this.slot.slotSymbols[0][0].symbol.width + 10);
        this.mainContainer.add([this.lineGenerator, this.slot]);

        this.uiPopups = new UiPopups(this, this.uiContainer, this.soundManager);
        this.mainContainer.add(this.uiPopups);

        this.lineSymbols = new LineSymbols(this, 200, 12, this.lineGenerator);
        this.mainContainer.add(this.lineSymbols);
        this.setupFocusBlurEvents()
    }

    update(time: number, delta: number) {
        this.uiContainer.update();
    }

    private onResultCallBack() {
        this.uiContainer.onSpin(false);
        this.soundManager.stopSound("onSpin"); 
        // this.lineGenerator.showLines(ResultData.gameData.cascading.lineToEmit);
    }

    private onSpinCallBack() {
        this.soundManager.playSound("onSpin");
        this.slot.moveReel();
        this.lineGenerator.hideLines();
    }

    recievedMessage(msgType: string, msgParams: any) {
        if (msgType === 'ResultData') {
            // Use setTimeout for better performance in this case
            setTimeout(() => {
                this.handleResultData();
            }, 3000); 

            // Stop tween after a delay for visual effect
            setTimeout(() => {
                this.slot.stopTween();
            }, 1000);
        } 
    }

    // Handle ResultData logic separately
    private handleResultData() {
        if(ResultData.gameData.freeSpinCount>0){
            this.reelBg.setTexture("freeSpinReel");
            this.gameBg.setTexture("freeSpinBg");
            this.hideButtons()
            if (!this.freeSpinInterval && ResultData.gameData.freeSpinCount > 0) {
                
                this.startFreeSpins();
                this.uiContainer.onSpin(true);
            }
            // this.uiContainer.spinBtn
        }else{
            this.showButtons();
            this.reelBg.setTexture("reelBg");
            this.gameBg.setTexture("gameBg");
        }
        if(ResultData.playerData.currentWining > 0){
            this.uiContainer.insideText.setText(`YOU WIN ${ResultData.playerData.currentWining}`);
        }else{
            this.uiContainer.insideText.setText(`BETTER LUCK NEXT TIME!`)
        }

        this.uiContainer.currentWiningText.updateLabelText(ResultData.playerData.currentWining.toFixed(2).toString());
        currentGameData.currentBalance = ResultData.playerData.Balance;        
    }

    private startFreeSpins() {
        if (this.freeSpinInterval) {
            clearInterval(this.freeSpinInterval);
        }
    
        const triggerNextSpin = () => {
            if (ResultData.gameData.freeSpinCount > 0) {
                // Check if cascading is still in progress
                if (!this.slot.isCascading) {
                    Globals.Socket?.sendMessage("SPIN", { 
                        currentBet: currentGameData.currentBetIndex, 
                        currentLines: initData.gameData.linesApiData.length, 
                        spins: 1 
                    });
                    this.onSpinCallBack();
                    ResultData.gameData.freeSpinCount--;
                    
                    setTimeout(() => {
                        this.slot.stopTween();
                    }, 1000);
    
                    // Wait for all cascading animations to complete before next spin
                    const checkCascading = () => {
                        if (!this.slot.isCascading) {
                            // Add a delay before next spin
                            setTimeout(() => {
                                triggerNextSpin();
                            }, 2000); // Adjust delay as needed
                        } else {
                            setTimeout(checkCascading, 500);
                        }
                    };
    
                    // Start checking after initial spin animations
                    setTimeout(checkCascading, 3000);
                }
            } else {
                this.endFreeSpins();
            }
        };
    
        // Start the first spin
        triggerNextSpin();
    }
    
    private endFreeSpins() {
        if (this.freeSpinInterval) {
            clearInterval(this.freeSpinInterval);
            this.freeSpinInterval = null;
        }
        ResultData.gameData.isFreeSpin = false;
        this.reelBg.setTexture("reelBg");
        this.gameBg.setTexture("gameBg");
        this.showButtons();
    }

    private hideButtons(){
        this.uiContainer.spinBtn.setVisible(false);
        this.uiContainer.spinBtn.disableInteractive();
        this.uiContainer.autoBetBtn.setVisible(false);
        this.uiContainer.autoBetBtn.disableInteractive();
        this.uiContainer.pBtn.disableInteractive();
        this.uiContainer.mBtn.disableInteractive();
    }
    private showButtons(){
        this.uiContainer.spinBtn.setVisible(true)
        this.uiContainer.spinBtn.setInteractive();
        this.uiContainer.autoBetBtn.setVisible(true);
        this.uiContainer.autoBetBtn.setInteractive()
        this.uiContainer.pBtn.setInteractive()
        this.uiContainer.mBtn.setInteractive()
    }

    private setupFocusBlurEvents() {
        window.addEventListener('blur', () => {
                this.soundManager.stopSound('backgroundMusic');
        });

        window.addEventListener('focus', () => {
            if(currentGameData.musicMode){
                this.soundManager.playSound('backgroundMusic');
            }
        });
    }
}
