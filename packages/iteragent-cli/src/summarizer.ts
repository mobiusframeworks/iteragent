import { HarvestedLogs } from './harvester';
import { TestSuite } from './tester';
import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';

export interface Summary {
  timestamp: Date;
  serverHealth: 'healthy' | 'unhealthy' | 'unknown';
  testResults: TestSuite | null;
  logAnalysis: HarvestedLogs;
  recommendations: string[];
  criticalIssues: string[];
  fixRequest: string;
}

export class Summarizer {
  async generateSummary(
    logs: HarvestedLogs, 
    testResults: TestSuite | null, 
    config: any
  ): Promise<Summary> {
    console.log(chalk.blue('📊 Generating summary...'));

    const timestamp = new Date();
    const serverHealth = this.assessServerHealth(logs);
    const recommendations = this.generateRecommendations(logs, testResults);
    const criticalIssues = this.identifyCriticalIssues(logs, testResults);
    const fixRequest = this.generateFixRequest(logs, testResults, criticalIssues);

    const summary: Summary = {
      timestamp,
      serverHealth,
      testResults,
      logAnalysis: logs,
      recommendations,
      criticalIssues,
      fixRequest
    };

    // Write summary files
    await this.writeSummaryFiles(summary, config);

    return summary;
  }

  private assessServerHealth(logs: HarvestedLogs): Summary['serverHealth'] {
    if (logs.summary.errorCount > 0) {
      return 'unhealthy';
    }
    
    const hasStartupMessage = logs.entries.some(log => 
      log.category === 'startup' && 
      log.message.toLowerCase().includes('ready')
    );
    
    if (hasStartupMessage && logs.summary.errorCount === 0) {
      return 'healthy';
    }
    
    return 'unknown';
  }

  private generateRecommendations(logs: HarvestedLogs, testResults: TestSuite | null): string[] {
    const recommendations: string[] = [];

    // Log-based recommendations
    if (logs.summary.errorCount > 0) {
      recommendations.push('Fix server errors to improve stability');
    }

    if (logs.summary.warningCount > 5) {
      recommendations.push('Address warnings to improve code quality');
    }

    const slowRequests = logs.entries.filter(log => 
      log.category === 'request' && 
      log.metadata?.responseTime && 
      log.metadata.responseTime > 1000
    );

    if (slowRequests.length > 0) {
      recommendations.push('Optimize slow API endpoints (>1s response time)');
    }

    // Test-based recommendations
    if (testResults) {
      if (testResults.summary.failed > 0) {
        recommendations.push('Fix failing tests to ensure functionality');
      }

      if (testResults.summary.averageResponseTime > 2000) {
        recommendations.push('Improve page load performance');
      }

      const accessibilityIssues = testResults.results.filter(r => 
        r.accessibility && r.accessibility.score < 80
      );

      if (accessibilityIssues.length > 0) {
        recommendations.push('Improve accessibility compliance');
      }
    }

    return recommendations;
  }

  private identifyCriticalIssues(logs: HarvestedLogs, testResults: TestSuite | null): string[] {
    const issues: string[] = [];

    // Critical log issues
    const criticalErrors = logs.errors.filter(log => 
      log.message.toLowerCase().includes('fatal') ||
      log.message.toLowerCase().includes('crash') ||
      log.message.toLowerCase().includes('cannot start')
    );

    criticalErrors.forEach(error => {
      issues.push(`Critical server error: ${error.message}`);
    });

    // Critical test issues
    if (testResults) {
      const criticalTestFailures = testResults.results.filter(r => 
        r.status === 'error' || 
        (r.status === 'fail' && r.errors.some(e => e.includes('timeout')))
      );

      criticalTestFailures.forEach(failure => {
        issues.push(`Critical test failure on ${failure.url}: ${failure.errors.join(', ')}`);
      });
    }

    return issues;
  }

  private generateFixRequest(
    logs: HarvestedLogs, 
    testResults: TestSuite | null, 
    criticalIssues: string[]
  ): string {
    let fixRequest = `# Fix Request - ${new Date().toISOString()}\n\n`;

    if (criticalIssues.length > 0) {
      fixRequest += `## 🚨 Critical Issues\n\n`;
      criticalIssues.forEach(issue => {
        fixRequest += `- ${issue}\n`;
      });
      fixRequest += `\n`;
    }

    if (logs.summary.errorCount > 0) {
      fixRequest += `## ❌ Server Errors (${logs.summary.errorCount})\n\n`;
      logs.errors.slice(-5).forEach(error => {
        fixRequest += `- **${error.timestamp.toISOString()}**: ${error.message}\n`;
      });
      fixRequest += `\n`;
    }

    if (logs.summary.warningCount > 0) {
      fixRequest += `## ⚠️ Warnings (${logs.summary.warningCount})\n\n`;
      logs.warnings.slice(-5).forEach(warning => {
        fixRequest += `- **${warning.timestamp.toISOString()}**: ${warning.message}\n`;
      });
      fixRequest += `\n`;
    }

    if (testResults && testResults.summary.failed > 0) {
      fixRequest += `## 🧪 Test Failures (${testResults.summary.failed})\n\n`;
      testResults.results.filter(r => r.status !== 'pass').forEach(result => {
        fixRequest += `- **${result.url}**: ${result.errors.join(', ')}\n`;
      });
      fixRequest += `\n`;
    }

    fixRequest += `## 📊 Summary\n\n`;
    fixRequest += `- Server Health: ${this.assessServerHealth(logs)}\n`;
    fixRequest += `- Total Log Entries: ${logs.summary.totalEntries}\n`;
    fixRequest += `- Errors: ${logs.summary.errorCount}\n`;
    fixRequest += `- Warnings: ${logs.summary.warningCount}\n`;
    
    if (testResults) {
      fixRequest += `- Tests Passed: ${testResults.summary.passed}/${testResults.summary.total}\n`;
      fixRequest += `- Average Response Time: ${testResults.summary.averageResponseTime.toFixed(2)}ms\n`;
    }

    fixRequest += `\n## 🔧 Recommended Actions\n\n`;
    const recommendations = this.generateRecommendations(logs, testResults);
    recommendations.forEach(rec => {
      fixRequest += `- ${rec}\n`;
    });

    fixRequest += `\n---\n\n`;
    fixRequest += `*Generated by IterAgent at ${new Date().toISOString()}*\n`;

    return fixRequest;
  }

  private async writeSummaryFiles(summary: Summary, config: any): Promise<void> {
    const outputDir = config.outputDir || '.iteragent';
    
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Write summary.md
    const summaryMarkdown = this.generateSummaryMarkdown(summary);
    await fs.writeFile(path.join(outputDir, 'summary.md'), summaryMarkdown);

    // Write fix_request.md
    await fs.writeFile(path.join(outputDir, 'fix_request.md'), summary.fixRequest);

    // Write detailed JSON report
    const jsonReport = {
      timestamp: summary.timestamp,
      serverHealth: summary.serverHealth,
      summary: {
        logs: summary.logAnalysis.summary,
        tests: summary.testResults?.summary || null
      },
      recommendations: summary.recommendations,
      criticalIssues: summary.criticalIssues
    };
    
    await fs.writeFile(
      path.join(outputDir, 'report.json'), 
      JSON.stringify(jsonReport, null, 2)
    );

    console.log(chalk.green(`✅ Summary files written to ${outputDir}/`));
  }

  private generateSummaryMarkdown(summary: Summary): string {
    let markdown = `# IterAgent Summary - ${summary.timestamp.toISOString()}\n\n`;

    // Server Health Status
    const healthEmoji = summary.serverHealth === 'healthy' ? '✅' : 
                       summary.serverHealth === 'unhealthy' ? '❌' : '⚠️';
    markdown += `## ${healthEmoji} Server Health: ${summary.serverHealth.toUpperCase()}\n\n`;

    // Quick Stats
    markdown += `## 📊 Quick Stats\n\n`;
    markdown += `- **Log Entries**: ${summary.logAnalysis.summary.totalEntries}\n`;
    markdown += `- **Errors**: ${summary.logAnalysis.summary.errorCount}\n`;
    markdown += `- **Warnings**: ${summary.logAnalysis.summary.warningCount}\n`;
    
    if (summary.testResults) {
      markdown += `- **Tests**: ${summary.testResults.summary.passed}/${summary.testResults.summary.total} passed\n`;
      markdown += `- **Avg Response Time**: ${summary.testResults.summary.averageResponseTime.toFixed(2)}ms\n`;
    }

    markdown += `\n`;

    // Critical Issues
    if (summary.criticalIssues.length > 0) {
      markdown += `## 🚨 Critical Issues\n\n`;
      summary.criticalIssues.forEach(issue => {
        markdown += `- ${issue}\n`;
      });
      markdown += `\n`;
    }

    // Recommendations
    if (summary.recommendations.length > 0) {
      markdown += `## 🔧 Recommendations\n\n`;
      summary.recommendations.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += `\n`;
    }

    // Log Categories
    markdown += `## 📝 Log Categories\n\n`;
    Object.entries(summary.logAnalysis.summary.categories).forEach(([category, count]) => {
      markdown += `- **${category}**: ${count} entries\n`;
    });

    markdown += `\n---\n\n`;
    markdown += `*Generated by IterAgent*\n`;

    return markdown;
  }
}
