/** 获取当前url */
export function currentURL(): string;

/** 当前浏览器可视范围高度 */
export function getClientHeight(): number;

/** 当前浏览器可视范围宽度 */
export function getPageViewWidth(): number;

/** 开启全屏 */
export function launchFullscreen(element: HTMLElement): void;

/** 关闭全屏 */
export function exitFullscreen(): void;

/** 返回滚动条位置 */
export function getScrollPosition(el?: Window | Element): { x: number; y: number };

/** 滚动到某一位置 */
export function smoothScroll(element: string): void;

/** 滚动到页面顶部 */
export function scrollToTop(): void;

/** 判断平台是android还是ios */
export function getOSType(): 'ios' | 'android' | 'other';

/** 下载文件 */
export function loadFile(url: string, name: string): void; 