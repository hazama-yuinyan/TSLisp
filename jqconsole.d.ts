///<reference path='jquery.d.ts' />

interface Ansi
{
    COLORS : string[];
    klasses : string[];
    getClasses() : string;
    stylize(text : string) : string;
}

declare function spanHtml(klass : string, content : string) : string;

interface JQConsole
{
    isMobile : bool;
    isIos : bool;
    isAndroid : bool;
    $window : JQuery;
    header : string;
    prompt_label_main : string;
    prompt_label_continue : string;
    indent_width : number;
    state : number;
    input_queue : any[];
    input_callback : (input) => void;
    multiline_callback : (input) => void;
    history : string[];
    history_index : number;
    history_new : string;
    history_active : bool;
    shortcuts : Object;
    ResetHistory() : void;
    ResetShortcuts() : void;
    ResetMatchings() : void;
    Reset() : void;
    GetHistory() : string[];
    SetHistory(history : string[]) : number;
    RegisterShortcut(key_code : any, callback : (key_code) => void) : void;
    UnRegisterShortcut(key_code : any, handler : (key_code) => void) : void;
    GetColumn() : number;
    GetLine() : number;
    ClearPromptText(clear_label : bool) : void;
    GetPromptText(full : bool) : string;
    SetPromptText(text : string) : void;
    Write(text : string, cls : string, escape? : bool) : JQuery;
    Append(node : any) : JQuery;
    Input(input_callback : (input : string) => void) : void;
    Prompt(history_enabled : bool, result_callback : (input : string) => void, multiline_callback? : (input : string) => any,
        async_multiline? : bool) : void;
    AbortPrompt() : void;
    Focus() : void;
    SetIndentWidth(width : number) : void;
    GetIndentWidth() : number;
    RegisterMatching(open : string, close : string, cls : string) : void;
    UnRegisterMatching(open : string, close : string) : string[];
    Dump() : string;
    GetState() : string;
    Disable() : void;
    Enable() : void;
    IsDisabled() : bool;
    MoveToStart(all_lines : bool) : void;
    MoveToEnd(all_lines : bool) : void;
}