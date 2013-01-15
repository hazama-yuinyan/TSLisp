module TSLisp{
    export module Test{
        export class TestFramework
        {
            constructor(public name : string, public body : string, public expected? : any[]){}
            
            public static create(name : string, body : string, expected? : any[]) : TestFramework
            {
                return new TestFramework(name, body, expected);
            }
        }
    }
}