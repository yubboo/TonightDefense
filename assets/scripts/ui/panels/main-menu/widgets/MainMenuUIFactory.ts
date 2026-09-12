import {
    Color,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Layers,
    Node,
    UITransform,
    VerticalTextAlignment,
} from 'cc';

import { MainMenuTheme } from './MainMenuTheme';
import { MainMenuArt } from './MainMenuArt';
import { AudioManager } from '../../../../systems/audio/AudioManager';

export class MainMenuUIFactory {
    static node(
        parent: Node,
        name: string,
        width: number,
        height: number,
        x = 0,
        y = 0,
    ): Node {
        const node = new Node(name);
        node.layer = Layers.Enum.UI_2D;
        parent.addChild(node);
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(width, height);
        return node;
    }

    static label(
        parent: Node,
        name: string,
        text: string,
        x: number,
        y: number,
        fontSize: number,
        width: number,
        color: Color = MainMenuTheme.ink,
        height?: number,
    ): Label {
        const node = this.node(
            parent,
            name,
            width,
            height ?? fontSize * 2.2,
            x,
            y,
        );

        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 4;
        label.color = color;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = HorizontalTextAlignment.CENTER;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        return label;
    }

    static roundedBox(
        parent: Node,
        name: string,
        width: number,
        height: number,
        x: number,
        y: number,
        fill: Color,
        stroke: Color = MainMenuTheme.ink,
        radius = 16,
        strokeWidth = 3,
        shadow = false,
    ): Node {
        const node = this.node(parent, name, width, height, x, y);
        const g = node.addComponent(Graphics);

        if (shadow) {
            g.fillColor = MainMenuTheme.shadow;
            g.roundRect(
                -width / 2 + 5,
                -height / 2 - 7,
                width,
                height,
                radius,
            );
            g.fill();
        }

        g.fillColor = fill;
        g.roundRect(
            -width / 2,
            -height / 2,
            width,
            height,
            radius,
        );
        g.fill();

        g.strokeColor = stroke;
        g.lineWidth = strokeWidth;
        g.roundRect(
            -width / 2 + 2,
            -height / 2 + 2,
            width - 4,
            height - 4,
            Math.max(2, radius - 2),
        );
        g.stroke();

        return node;
    }

    static darkButton(
        parent: Node,
        name: string,
        width: number,
        height: number,
        x: number,
        y: number,
    ): Node {
        const node = this.roundedBox(
            parent,
            name,
            width,
            height,
            x,
            y,
            MainMenuTheme.darkPanel,
            new Color(21, 24, 23, 255),
            14,
            4,
            true,
        );

        const g = node.getComponent(Graphics);
        if (g) {
            g.strokeColor = new Color(116, 125, 119, 175);
            g.lineWidth = 1;
            g.roundRect(
                -width / 2 + 8,
                -height / 2 + 8,
                width - 16,
                height - 16,
                8,
            );
            g.stroke();
        }

        return node;
    }

    static paperCard(
        parent: Node,
        name: string,
        width: number,
        height: number,
        x: number,
        y: number,
    ): Node {
        const node = this.node(parent, name, width, height, x, y);
        const g = node.addComponent(Graphics);

        // 手绘感黑色背板
        g.fillColor = new Color(25, 28, 27, 105);
        g.moveTo(-width / 2 + 9, -height / 2 - 9);
        g.lineTo(width / 2 + 8, -height / 2 + 2);
        g.lineTo(width / 2 - 2, height / 2 - 8);
        g.lineTo(-width / 2 - 8, height / 2 + 4);
        g.close();
        g.fill();

        // 纸张主体
        g.fillColor = MainMenuTheme.paper;
        g.moveTo(-width / 2, -height / 2 + 8);
        g.lineTo(width / 2 - 8, -height / 2);
        g.lineTo(width / 2, height / 2 - 8);
        g.lineTo(-width / 2 + 8, height / 2);
        g.close();
        g.fill();

        g.strokeColor = MainMenuTheme.ink;
        g.lineWidth = 5;
        g.moveTo(-width / 2, -height / 2 + 8);
        g.lineTo(width / 2 - 8, -height / 2);
        g.lineTo(width / 2, height / 2 - 8);
        g.lineTo(-width / 2 + 8, height / 2);
        g.close();
        g.stroke();

        g.strokeColor = new Color(159, 151, 133, 160);
        g.lineWidth = 2;
        g.roundRect(
            -width / 2 + 14,
            -height / 2 + 14,
            width - 28,
            height - 28,
            8,
        );
        g.stroke();

        return node;
    }

    static yellowButton(
        parent: Node,
        name: string,
        width: number,
        height: number,
        x: number,
        y: number,
    ): Node {
        const node = this.node(parent, name, width, height, x, y);
        const g = node.addComponent(Graphics);

        g.fillColor = MainMenuTheme.shadow;
        g.moveTo(-width / 2 + 6, -height / 2 - 7);
        g.lineTo(width / 2 + 4, -height / 2 - 2);
        g.lineTo(width / 2 - 4, height / 2 - 4);
        g.lineTo(-width / 2 - 4, height / 2 + 3);
        g.close();
        g.fill();

        g.fillColor = new Color(255, 201, 72, 255);
        g.moveTo(-width / 2, -height / 2 + 4);
        g.lineTo(width / 2 - 4, -height / 2);
        g.lineTo(width / 2, height / 2 - 4);
        g.lineTo(-width / 2 + 4, height / 2);
        g.close();
        g.fill();

        g.strokeColor = MainMenuTheme.ink;
        g.lineWidth = 5;
        g.moveTo(-width / 2, -height / 2 + 4);
        g.lineTo(width / 2 - 4, -height / 2);
        g.lineTo(width / 2, height / 2 - 4);
        g.lineTo(-width / 2 + 4, height / 2);
        g.close();
        g.stroke();

        g.strokeColor = new Color(255, 232, 153, 230);
        g.lineWidth = 2;
        g.roundRect(
            -width / 2 + 10,
            -height / 2 + 10,
            width - 20,
            height - 20,
            10,
        );
        g.stroke();

        MainMenuArt.attach(node, 'button-gold-blank', width, height, 'stretch');
        return node;
    }

    static bindPress(node: Node, action: () => void): void {
        node.on(Node.EventType.TOUCH_START, () => {
            node.setScale(0.96, 0.96, 1);
        });

        node.on(Node.EventType.TOUCH_CANCEL, () => {
            node.setScale(1, 1, 1);
        });

        node.on(Node.EventType.TOUCH_END, () => {
            node.setScale(1, 1, 1);
            AudioManager.playUi();
            action();
        });
    }
}
