// 演示版的动作全部为空操作：页面上不会真的写数据。
// 不是 "use server" 模块，所以静态导出不会报错。

export async function createDocumentAction(_formData: FormData): Promise<void> {
  void _formData;
}
export async function postDocAction(_formData: FormData): Promise<void> {
  void _formData;
}
export async function saveItemAction(_formData: FormData): Promise<void> {
  void _formData;
}
export async function finishStocktakeAction(_formData: FormData): Promise<void> {
  void _formData;
}
export async function createStocktakeAction(): Promise<void> {}
export async function resetDataAction(): Promise<void> {}
