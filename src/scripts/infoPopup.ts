import Phaser, { Scene } from "phaser";
import { Globals, initData, ResultData } from "./Globals";
import { gameConfig } from "./appconfig";

export default class InfoScene extends Scene{
    pageviewContainer!: Phaser.GameObjects.Container;
    popupBackground!: Phaser.GameObjects.Sprite
    SceneBg!: Phaser.GameObjects.Sprite
    Symbol1!: Phaser.GameObjects.Sprite
    leftArrow!: Phaser.GameObjects.Sprite
    rightArrow!: Phaser.GameObjects.Sprite
    infoCross!: Phaser.GameObjects.Sprite
    currentPageIndex: number = 0;
    pages: Phaser.GameObjects.Container[] = [];
    constructor(){
        super({key: 'InfoScene'})
    }
    create(){
        const {width, height} =  this.cameras.main
        this.SceneBg = new Phaser.GameObjects.Sprite(this, width / 2, height / 2, 'Background')
        .setDisplaySize(width, height)
        .setDepth(11)
        .setInteractive();
        this.SceneBg.on('pointerdown', (pointer:Phaser.Input.Pointer)=>{
            pointer.event.stopPropagation();
        })
        this.pageviewContainer = this.add.container();
        this.popupBackground = new Phaser.GameObjects.Sprite(this, gameConfig.scale.width/2, gameConfig.scale.height/2, "messagePopup").setDisplaySize(1600, 800);
        const inputOverlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setDepth(16)
            .setInteractive();
    
        inputOverlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            pointer.event.stopPropagation();
        });
        this.pageviewContainer.add([inputOverlay, this.popupBackground])
        this.leftArrow = new Phaser.GameObjects.Sprite(this, gameConfig.scale.width/2 - 100, gameConfig.scale.height * 0.91, "leftArrow").setInteractive().setScale(1.3);
        this.rightArrow = new Phaser.GameObjects.Sprite(this, gameConfig.scale.width/2 + 100, gameConfig.scale.height * 0.91, "rightArrow").setInteractive().setScale(1.3);
        this.infoCross = new Phaser.GameObjects.Sprite(this, gameConfig.scale.width/2, gameConfig.scale.height * 0.91, "stopClose").setInteractive().setScale(1.3)
        this.infoCross.on('pointerdown', ()=>{
            if(Globals.SceneHandler?.getScene("InfoScene")){
                Globals.SceneHandler.removeScene("InfoScene")
            }
        });
        this.leftArrow.on('pointerdown', ()=>{
            this.goToPreviousPage();
        })
        this.rightArrow.on('pointerdown', ()=>{
            this.goToNextPage()
        })
        this.pageviewContainer.add([this.leftArrow, this.rightArrow, this.infoCross])
        this.pages = []
        this.createPages()

    }
    createPages() {
        // Create pages and add content
        this.pages[1] = this.add.container(0, 0);
        
        const cowbg = this.add.sprite(700, 400, "cowbg").setScale(0.6).setOrigin(0.5)

        const wildCow = this.add.sprite(550, 400, "threeCow").setOrigin(0.5).setScale(0.7)
        const wildText = this.add.text(1000, 400, initData.UIData.symbols[12].description, {fontFamily:"RobotoCondensed", fontSize:"30px", color: "#ffffff", wordWrap:{ width: 300, useAdvancedWrap: true }}).setOrigin(0.5)
        const jackpotBg = this.add.sprite(1440, 400, "jackpotBg").setDisplaySize(520, 220).setOrigin(0.5)
        const jackpotIcon = this.add.sprite(1280, 400, "slots13_0").setOrigin(0.5).setScale(0.7)
        const jackpotText = this.add.text(1530, 400, initData.UIData.symbols[13].description, {fontFamily:"RobotoCondensed", fontSize:"30px", color: "#ffffff", wordWrap:{ width: 300, useAdvancedWrap: true }}).setOrigin(0.5)
        // const symbol1 = this.add.sprite(500, 400, "slots0_0").setScale(0.8)
        // const symbol2 = this.add.sprite(900, 400, "slots1_0").setScale(0.8)
        // const symbol3 = this.add.sprite(1250, 400, "slots2_0").setScale(0.8)
        const symbol11 = this.add.sprite(450, 600, "slots11_0").setScale(0.8)
        const symbol10 = this.add.sprite(800, 600, "slots10_0").setScale(0.8)
        const symbol9 = this.add.sprite(1150, 600, "slots9_0").setScale(0.8)
        const symbol8 = this.add.sprite(1500, 600, "slots8_0").setScale(0.8)
        const infoIcons = [
            { x: 390, y: 800 }, //
            { x: 740, y: 800 }, //
            { x: 1100, y: 800 }, //
            { x: 1430, y: 800 }, //
        ]

        const symbolIndices = [11, 10, 9, 8];

        symbolIndices.forEach((targetSymbolIndex, displayIndex) => {
            const symbol = initData.UIData.symbols[targetSymbolIndex];
            if (!symbol) return;    
            const iconPosition = infoIcons[displayIndex]; // Use displayIndex for icon position
            
            if (!iconPosition) return;
        
            // Add background image first
            const inconBgImage = this.add.sprite(iconPosition.x + 60, iconPosition.y - 50, "iconBg").setScale(0.7);
            this.pages[1].add(inconBgImage);
        
            // Then add all text elements
            symbol.multiplier.forEach((multiplierValueArray, multiplierIndex, array) => {
                if (Array.isArray(multiplierValueArray)) {
                    const multiplierValue = multiplierValueArray[0];
                    if (multiplierValue > 0) {
                        const prefix = (5 - multiplierIndex) + "x";
                        let text = `${prefix} - ${multiplierValue} \n`;            
                        
                        const textObject = this.add.text(
                            iconPosition.x,
                            iconPosition.y + multiplierIndex * 60,
                            text,
                            { fontFamily: "Anton", fontSize: '35px', color: '#fff' }
                        );
                        
                        textObject.setLineSpacing(100);
                        textObject.setOrigin(0, 0.5);
                        this.pages[1].add(textObject);
                    }
                }
            });
        });
        

        this.pages[1].add([cowbg, wildCow, wildText, jackpotBg, jackpotIcon, jackpotText, symbol11, symbol10, symbol9, symbol8])
        this.pageviewContainer.add(this.pages[1]);

        this.pages[2] = this.add.container(0, 0);  // Position off-screen initially
        // const payTableHeading = this.add.text(this.scale.width/2, 200, "Paytable", {fontFamily:"Anton", color: "#ffffff", fontSize: "70px"}).setOrigin(0.5)
        const symbol7 = this.add.sprite(450, 260, "slots7_0").setScale(0.8)
        const symbol6 = this.add.sprite(800, 260, "slots6_0").setScale(0.8)
        const symbol5 = this.add.sprite(1150, 260, "slots5_0").setScale(0.8)
        const symbol4 = this.add.sprite(1500, 260, "slots4_0").setScale(0.8)
        const symbol3 = this.add.sprite(450, 600, "slots3_0").setScale(0.8)
        const symbol2 = this.add.sprite(800, 600, "slots2_0").setScale(0.8)
        const symbol1 = this.add.sprite(1150, 600, "slots1_0").setScale(0.8)
        const symbol0 = this.add.sprite(1500, 600, "slots0_0").setScale(0.8)
        const inewnfoIcons = [
            { x: 390, y: 430 }, //
            { x: 740, y: 430 }, //
            { x: 1100, y: 430 }, //
            { x: 1430, y: 430 }, //
            { x: 390, y: 800 }, //
            { x: 740, y: 800 }, //
            { x: 1100, y: 800 }, //
            { x: 1430, y: 800 }, //
        ]


        const secondsymbolIndices = [7, 6, 5, 4, 3, 2, 1, 0];

        secondsymbolIndices.forEach((targetSymbolIndex, twicedisplayIndex) => {
            const secondSymbol = initData.UIData.symbols[targetSymbolIndex];
            if (!secondSymbol) return;    
            const iconPosition = inewnfoIcons[twicedisplayIndex]; // Use displayIndex for icon position
            
            if (!iconPosition) return;
        
            // Add background image first
            const inconBgImage = this.add.sprite(iconPosition.x + 60, iconPosition.y - 50, "iconBg").setScale(0.7);
            this.pages[2].add(inconBgImage);
        
            // Then add all text elements
            secondSymbol.multiplier.forEach((newmultiplierValueArray, multiplierIndex, array) => {
                if (Array.isArray(newmultiplierValueArray)) {
                    const mymultiplierValue = newmultiplierValueArray[0];
                    if (mymultiplierValue > 0) {
                        const newprefix = (5 - multiplierIndex) + "x";
                        let newtext = `${newprefix} - ${mymultiplierValue} \n`;            
                        
                        const secondTextObject = this.add.text(
                            iconPosition.x,
                            iconPosition.y + multiplierIndex * 60,
                            newtext,
                            { fontFamily: "Anton", fontSize: '35px', color: '#fff' }
                        );
                        secondTextObject.setLineSpacing(100);
                        secondTextObject.setOrigin(0, 0.5);
                        this.pages[2].add(secondTextObject);
                    }
                }
            });
        });

        this.pages[2].add([symbol7, symbol6, symbol5, symbol4, symbol3, symbol2, symbol1, symbol0]);
        this.pageviewContainer.add(this.pages[2]);
       

        this.pages[3] = this.add.container(0, 0);  // Position off-screen initially
        
        const payTableImage = this.add.sprite(gameConfig.scale.width/2, gameConfig.scale.height/2, "payLines").setScale(1.2)

        this.pages[3].add([ payTableImage])
        this.pageviewContainer.add(this.pages[3]);

        this.pages[4] = this.add.container(0, 0);

        const freeSpinHeading = this.add.text(this.scale.width/2, 300, "Free Spin", {fontFamily:"RobotoCondensed", color: "#000000", fontSize: "80px"}).setOrigin(0.5)

        const freeSpinDescription = this.add.text(this.scale.width/2, 450, "During Free Spins, the bet per line and the active payline remain the same as the spin that triggered the feature", {fontFamily:"RobotoCondensed", color: "#000000", fontSize: "50px", wordWrap:{ width: 1100, useAdvancedWrap: true }}).setOrigin(0.5)
        const freeSpinDescription2 = this.add.text(this.scale.width/2, 700, `4 or more consecutive cascades trigger the free spins \n 4 consecutive cascades awards 3 free plays \n 5 consecutive cascades awards 5 free plays \n 6 consecutive cascades awards 7 free plays \n 7 consecutive cascades awards 10 free plays \n 8 consecutive cascades awards 25 free plays`, {fontFamily:"RobotoCondensed", color: "#000000", fontSize: "40px", wordWrap:{ width: 1000, useAdvancedWrap: true }}).setOrigin(0.5)
        this.pages[4].add([freeSpinHeading, freeSpinDescription, freeSpinDescription2])
        this.pages = [this.pages[1], this.pages[2], this.pages[3], this.pages[4]];
        this.currentPageIndex = 0;
        
        // Set initial visibility 
        this.pages.forEach((page, index) => {
            page.setVisible(index === this.currentPageIndex);
        });
    }

    goToNextPage() {
        if (this.currentPageIndex < this.pages.length - 1) {
            this.pages[this.currentPageIndex].setVisible(false);
            this.currentPageIndex++;
            this.pages[this.currentPageIndex].setVisible(true);
        }
    }

    goToPreviousPage() {
        if (this.currentPageIndex > 0) {
            this.pages[this.currentPageIndex].setVisible(false);
            this.currentPageIndex--;
            this.pages[this.currentPageIndex].setVisible(true);
        }
    }
}