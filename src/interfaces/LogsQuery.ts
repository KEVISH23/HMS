export interface LogsQuery{
    search:string|undefined,
    year:string|undefined
    dateRange:string|undefined
    disease:string|undefined
    page:string|undefined
    limit:string|undefined
    id?:string
}