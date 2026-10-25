export const TYPE_LABEL: Record<string, string> = {
  model_launch: 'Model launch', product_launch: 'Product launch', startup_feature: 'Startup feature',
  funding: 'Funding', skills_guide: 'Skills guide', local_news: 'Local news', research: 'Research', ecosystem: 'Landscape',
};
export const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
