/**
 * NukeViet NVIframe for CKEditor5
 * @version 4.x
 * @author VINADES.,JSC <contact@vinades.vn>
 * @copyright (C) 2009-2024 VINADES.,JSC. All rights reserved
 * @license GNU/GPL version 2 or any later version
 * @see https://github.com/nukeviet The NukeViet CMS GitHub project
 */

/**
 * Options khi thực thi lệnh chèn iframe
 */
export type IframeExecuteCommandOptions = {
    src: string;
    width?: number | null;
    height?: number | null;
    type?: 'auto' | 'fixed' | null;
    ratio?: [number, number] | null;
};

/**
 * @returns Các giá trị mặc định khi thực thi lệnh chèn iframe
 */
export function getDefaultIframeExecuteCommandOptions(): IframeExecuteCommandOptions {
    return {
        src: '',
        width: 560,
        height: 315,
        type: 'auto',
        ratio: [16, 9]
    };
}
