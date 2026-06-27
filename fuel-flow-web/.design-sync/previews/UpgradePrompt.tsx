import { UpgradePrompt } from 'fuel-flow-web';

export const Default = () => (
  <div className="max-w-xl">
    <UpgradePrompt
      featureName="Reports Export"
      description="Export shift and sales reports to PDF and Excel on the Professional plan."
    />
  </div>
);
