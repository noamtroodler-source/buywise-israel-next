import { Shield, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ProjectBuyerProtections() {
  return (
    <TooltipProvider>
      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-green-800 dark:text-green-300">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            Buyer Protections
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <ul className="space-y-2 text-sm text-green-700 dark:text-green-400">
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>
                Bank Guarantee
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 inline ml-1 text-green-600/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">Israeli law requires developers to provide bank guarantees protecting your payments until the property is registered in your name.</p>
                  </TooltipContent>
                </Tooltip>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>1-Year Warranty</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>
                Staged Payments
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 inline ml-1 text-green-600/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">Pay in milestones as construction progresses, typically 10/15/25/50% at key stages.</p>
                  </TooltipContent>
                </Tooltip>
              </span>
            </li>
          </ul>
          <Link 
            to="/guides/new-construction" 
            className="text-xs text-green-700 dark:text-green-400 hover:underline font-medium inline-block"
          >
            Learn more about buyer protections →
          </Link>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
