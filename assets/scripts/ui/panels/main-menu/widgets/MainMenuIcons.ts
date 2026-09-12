import {
    Color,
    Graphics,
    Layers,
    Node,
    UITransform,
} from 'cc';

import { MainMenuTheme } from './MainMenuTheme';
import { MainMenuArt } from './MainMenuArt';
import { MainMenuArtKey } from '../../../resources/UIResourceCatalog';

export type MainMenuIconKind =
    | 'shop'
    | 'hero'
    | 'battle'
    | 'warehouse'
    | 'upgrade'
    | 'territory'
    | 'challenge'
    | 'sweep'
    | 'activity'
    | 'more'
    | 'mail'
    | 'settings'
    | 'coin'
    | 'gem'
    | 'diamond'
    | 'stamina'
    | 'meal'
    | 'wall'
    | 'princess';

export class MainMenuIcons {
    static create(
        parent: Node,
        name: string,
        kind: MainMenuIconKind,
        x: number,
        y: number,
        size = 48,
        color: Color = MainMenuTheme.white,
    ): Node {
        const node = new Node(name);
        node.layer = Layers.Enum.UI_2D;
        parent.addChild(node);
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(size, size);

        const g = node.addComponent(Graphics);
        g.fillColor = color;
        g.strokeColor = color;

        const s = size / 48;

        switch (kind) {
            case 'shop':
                this.drawShop(g, s);
                break;

            case 'hero':
                this.drawHelmet(g, s);
                break;

            case 'battle':
                this.drawSwords(g, s);
                break;

            case 'warehouse':
                this.drawChest(g, s);
                break;

            case 'upgrade':
                this.drawStatue(g, s);
                break;

            case 'territory':
                this.drawCastle(g, s);
                break;

            case 'challenge':
                this.drawSkull(g, s);
                break;

            case 'sweep':
                this.drawScroll(g, s);
                break;

            case 'activity':
                this.drawGift(g, s);
                break;

            case 'more':
                this.drawMore(g, s);
                break;

            case 'mail':
                this.drawMail(g, s);
                break;

            case 'settings':
                this.drawGear(g, s);
                break;

            case 'coin':
                this.drawCoin(g, s);
                break;

            case 'gem':
            case 'diamond':
                this.drawGem(g, s);
                break;

            case 'stamina':
                this.drawStamina(g, s);
                break;

            case 'meal':
                this.drawMeal(g, s);
                break;

            case 'wall':
                this.drawWall(g, s);
                break;

            case 'princess':
                this.drawPrincess(g, s);
                break;
        }

        const assets: Partial<Record<MainMenuIconKind, MainMenuArtKey>> = {
            shop: 'icon-shop', hero: 'icon-hero', battle: 'icon-battle',
            warehouse: 'icon-warehouse', upgrade: 'icon-upgrade',
            coin: 'icon-coin', gem: 'icon-gem-purple', diamond: 'icon-diamond-blue',
        };
        const asset = assets[kind];
        if (asset) MainMenuArt.attach(node, asset, size, size);
        return node;
    }

    private static drawShop(g: Graphics, s: number): void {
        g.fillColor = new Color(238, 91, 64, 255);

        for (let i = -2; i <= 2; i += 1) {
            g.rect((i * 8 - 4) * s, 10 * s, 8 * s, 10 * s);
            g.fill();
        }

        g.fillColor = new Color(226, 199, 147, 255);
        g.rect(-18 * s, -16 * s, 36 * s, 27 * s);
        g.fill();

        g.strokeColor = MainMenuTheme.ink;
        g.lineWidth = 3 * s;
        g.rect(-18 * s, -16 * s, 36 * s, 27 * s);
        g.stroke();
    }

    private static drawHelmet(g: Graphics, s: number): void {
        g.fillColor = new Color(188, 209, 232, 255);
        g.moveTo(-18 * s, 14 * s);
        g.lineTo(-11 * s, 22 * s);
        g.lineTo(0, 16 * s);
        g.lineTo(11 * s, 22 * s);
        g.lineTo(18 * s, 14 * s);
        g.lineTo(14 * s, -18 * s);
        g.lineTo(-14 * s, -18 * s);
        g.close();
        g.fill();

        g.strokeColor = MainMenuTheme.ink;
        g.lineWidth = 4 * s;
        g.stroke();

        g.moveTo(0, 16 * s);
        g.lineTo(0, -13 * s);
        g.stroke();
    }

    private static drawSwords(g: Graphics, s: number): void {
        g.strokeColor = new Color(227, 231, 232, 255);
        g.lineWidth = 6 * s;

        g.moveTo(-17 * s, 17 * s);
        g.lineTo(17 * s, -17 * s);

        g.moveTo(17 * s, 17 * s);
        g.lineTo(-17 * s, -17 * s);

        g.stroke();

        g.fillColor = new Color(237, 163, 46, 255);
        g.rect(-22 * s, 13 * s, 10 * s, 7 * s);
        g.rect(12 * s, 13 * s, 10 * s, 7 * s);
        g.fill();
    }

    private static drawChest(g: Graphics, s: number): void {
        g.fillColor = new Color(169, 81, 45, 255);
        g.roundRect(-20 * s, -15 * s, 40 * s, 28 * s, 5 * s);
        g.fill();

        g.strokeColor = MainMenuTheme.ink;
        g.lineWidth = 3 * s;
        g.roundRect(-20 * s, -15 * s, 40 * s, 28 * s, 5 * s);
        g.stroke();

        g.fillColor = new Color(246, 185, 57, 255);
        g.rect(-4 * s, -14 * s, 8 * s, 28 * s);
        g.fill();
    }

    private static drawStatue(g: Graphics, s: number): void {
        g.fillColor = new Color(205, 210, 214, 255);
        g.roundRect(-12 * s, -14 * s, 24 * s, 29 * s, 7 * s);
        g.fill();
        g.circle(0, 15 * s, 9 * s);
        g.fill();

        g.fillColor = new Color(91, 200, 228, 255);
        g.moveTo(0, 4 * s);
        g.lineTo(6 * s, -4 * s);
        g.lineTo(0, -12 * s);
        g.lineTo(-6 * s, -4 * s);
        g.close();
        g.fill();

        g.fillColor = new Color(145, 149, 151, 255);
        g.rect(-18 * s, -21 * s, 36 * s, 6 * s);
        g.fill();
    }

    private static drawCastle(g: Graphics, s: number): void {
        g.fillColor = new Color(229, 224, 205, 255);
        g.rect(-18 * s, -16 * s, 36 * s, 28 * s);
        g.fill();

        g.rect(-21 * s, 7 * s, 10 * s, 14 * s);
        g.rect(11 * s, 7 * s, 10 * s, 14 * s);
        g.fill();

        g.fillColor = MainMenuTheme.ink;
        g.roundRect(-5 * s, -16 * s, 10 * s, 15 * s, 5 * s);
        g.fill();
    }

    private static drawSkull(g: Graphics, s: number): void {
        g.fillColor = MainMenuTheme.white;
        g.circle(0, 5 * s, 17 * s);
        g.fill();

        g.rect(-10 * s, -14 * s, 20 * s, 14 * s);
        g.fill();

        g.fillColor = MainMenuTheme.ink;
        g.circle(-6 * s, 7 * s, 4 * s);
        g.circle(6 * s, 7 * s, 4 * s);
        g.fill();

        g.rect(-3 * s, -1 * s, 6 * s, 5 * s);
        g.fill();
    }

    private static drawScroll(g: Graphics, s: number): void {
        g.fillColor = new Color(238, 216, 167, 255);
        g.roundRect(-17 * s, -18 * s, 34 * s, 36 * s, 5 * s);
        g.fill();

        g.strokeColor = MainMenuTheme.ink;
        g.lineWidth = 3 * s;
        g.roundRect(-17 * s, -18 * s, 34 * s, 36 * s, 5 * s);
        g.stroke();

        g.moveTo(-8 * s, 8 * s);
        g.lineTo(8 * s, 8 * s);
        g.moveTo(-8 * s, 0);
        g.lineTo(6 * s, 0);
        g.stroke();
    }

    private static drawGift(g: Graphics, s: number): void {
        g.fillColor = new Color(57, 188, 161, 255);
        g.rect(-18 * s, -12 * s, 36 * s, 28 * s);
        g.fill();

        g.fillColor = new Color(239, 178, 54, 255);
        g.rect(-4 * s, -12 * s, 8 * s, 28 * s);
        g.fill();

        g.strokeColor = MainMenuTheme.ink;
        g.lineWidth = 3 * s;
        g.rect(-18 * s, -12 * s, 36 * s, 28 * s);
        g.stroke();

        g.arc(-6 * s, 17 * s, 8 * s, 0, Math.PI * 2, false);
        g.arc(6 * s, 17 * s, 8 * s, 0, Math.PI * 2, false);
        g.stroke();
    }

    private static drawMore(g: Graphics, s: number): void {
        g.fillColor = MainMenuTheme.white;
        for (const x of [-12, 0, 12]) {
            g.circle(x * s, 0, 5 * s);
            g.fill();
        }
    }

    private static drawMail(g: Graphics, s: number): void {
        g.strokeColor = MainMenuTheme.white;
        g.lineWidth = 3 * s;

        g.roundRect(-19 * s, -13 * s, 38 * s, 27 * s, 4 * s);
        g.stroke();

        g.moveTo(-18 * s, 12 * s);
        g.lineTo(0, -2 * s);
        g.lineTo(18 * s, 12 * s);
        g.stroke();
    }

    private static drawGear(g: Graphics, s: number): void {
        g.fillColor = MainMenuTheme.white;
        g.circle(0, 0, 15 * s);
        g.fill();

        for (let i = 0; i < 8; i += 1) {
            const a = i * Math.PI / 4;
            const x = Math.cos(a) * 20 * s;
            const y = Math.sin(a) * 20 * s;
            g.rect(x - 4 * s, y - 4 * s, 8 * s, 8 * s);
            g.fill();
        }

        g.fillColor = MainMenuTheme.ink;
        g.circle(0, 0, 6 * s);
        g.fill();
    }

    private static drawCoin(g: Graphics, s: number): void {
        g.fillColor = new Color(239, 181, 46, 255);
        g.circle(0, 0, 18 * s);
        g.fill();

        g.strokeColor = MainMenuTheme.ink;
        g.lineWidth = 3 * s;
        g.circle(0, 0, 18 * s);
        g.stroke();

        g.circle(0, 0, 11 * s);
        g.stroke();
    }

    private static drawGem(g: Graphics, s: number): void {
        g.fillColor = new Color(160, 76, 221, 255);
        g.moveTo(0, 21 * s);
        g.lineTo(17 * s, 4 * s);
        g.lineTo(0, -21 * s);
        g.lineTo(-17 * s, 4 * s);
        g.close();
        g.fill();

        g.strokeColor = MainMenuTheme.ink;
        g.lineWidth = 3 * s;
        g.stroke();
    }


    private static drawStamina(g: Graphics, s: number): void {
        g.fillColor = new Color(109, 218, 88, 255);

        g.moveTo(4 * s, 23 * s);
        g.lineTo(-12 * s, 3 * s);
        g.lineTo(-2 * s, 3 * s);
        g.lineTo(-7 * s, -22 * s);
        g.lineTo(14 * s, 4 * s);
        g.lineTo(4 * s, 4 * s);
        g.close();
        g.fill();

        g.strokeColor = MainMenuTheme.ink;
        g.lineWidth = 2 * s;
        g.stroke();
    }

    private static drawMeal(g: Graphics, s: number): void {
        g.strokeColor = MainMenuTheme.white;
        g.lineWidth = 3 * s;

        g.moveTo(-10 * s, 18 * s);
        g.bezierCurveTo(
            -16 * s,
            11 * s,
            -5 * s,
            7 * s,
            -11 * s,
            1 * s,
        );

        g.moveTo(3 * s, 20 * s);
        g.bezierCurveTo(
            -3 * s,
            12 * s,
            8 * s,
            8 * s,
            2 * s,
            1 * s,
        );

        g.moveTo(15 * s, 16 * s);
        g.bezierCurveTo(
            9 * s,
            10 * s,
            19 * s,
            7 * s,
            13 * s,
            1 * s,
        );

        g.stroke();

        g.fillColor = new Color(238, 216, 167, 255);
        g.moveTo(-19 * s, -1 * s);
        g.lineTo(19 * s, -1 * s);
        g.bezierCurveTo(
            15 * s,
            -17 * s,
            8 * s,
            -21 * s,
            0,
            -21 * s,
        );
        g.bezierCurveTo(
            -8 * s,
            -21 * s,
            -15 * s,
            -17 * s,
            -19 * s,
            -1 * s,
        );
        g.close();
        g.fill();

        g.strokeColor = MainMenuTheme.ink;
        g.lineWidth = 2 * s;
        g.stroke();

        g.moveTo(-14 * s, -24 * s);
        g.lineTo(14 * s, -24 * s);
        g.stroke();
    }

    private static drawWall(g: Graphics, s: number): void {
        g.fillColor = new Color(181, 184, 182, 255);
        g.rect(-21 * s, -15 * s, 42 * s, 29 * s);
        g.fill();

        g.strokeColor = MainMenuTheme.ink;
        g.lineWidth = 3 * s;
        g.rect(-21 * s, -15 * s, 42 * s, 29 * s);
        g.stroke();

        g.moveTo(-21 * s, -2 * s);
        g.lineTo(21 * s, -2 * s);
        g.moveTo(-8 * s, -15 * s);
        g.lineTo(-8 * s, 14 * s);
        g.moveTo(8 * s, -15 * s);
        g.lineTo(8 * s, 14 * s);
        g.stroke();
    }

    private static drawPrincess(g: Graphics, s: number): void {
        g.fillColor = new Color(244, 139, 175, 255);
        g.moveTo(0, 16 * s);
        g.lineTo(18 * s, -18 * s);
        g.lineTo(-18 * s, -18 * s);
        g.close();
        g.fill();

        g.fillColor = new Color(249, 223, 189, 255);
        g.circle(0, 17 * s, 10 * s);
        g.fill();

        g.fillColor = new Color(246, 183, 63, 255);
        g.moveTo(-9 * s, 25 * s);
        g.lineTo(-5 * s, 36 * s);
        g.lineTo(0, 27 * s);
        g.lineTo(5 * s, 36 * s);
        g.lineTo(9 * s, 25 * s);
        g.close();
        g.fill();
    }
}
