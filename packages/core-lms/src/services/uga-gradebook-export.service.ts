export interface StudentGradebookRow {
  orgDefinedId: string; // e.g., "811234567"
  username: string;     // MyID / loginId
  lastName: string;
  firstName: string;
  itemScores: Record<string, number | null>; // key: item.title
  calculatedFinalGrade: number;
  adjustedFinalGrade: number | null;
}

export class UgaGradebookExporter {
  /**
   * Converts numeric score to UGA +/- Letter Grade Scheme
   */
  static toPlusMinusLetterGrade(score: number): string {
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generates standard UGA eLC Gradebook CSV with mandatory `#` End-of-Line Indicator
   */
  static exportStandardElcCsv(itemTitles: string[], rows: StudentGradebookRow[]): string {
    const itemHeaders = itemTitles.map((title) => `${title} Points Grade`);
    const headers = [
      'OrgDefinedID',
      'Username',
      'Last Name',
      'First Name',
      ...itemHeaders,
      'Calculated Final Grade Numerator',
      'Adjusted Final Grade Numerator',
      'End-of-Line Indicator',
    ];

    const csvLines = [headers.join(',')];

    for (const row of rows) {
      const scores = itemTitles.map((t) =>
        row.itemScores[t] !== null && row.itemScores[t] !== undefined ? String(row.itemScores[t]) : ''
      );
      const adj = row.adjustedFinalGrade ?? row.calculatedFinalGrade;
      const line = [
        `#${row.orgDefinedId}`,
        row.username,
        `"${row.lastName}"`,
        `"${row.firstName}"`,
        ...scores,
        row.calculatedFinalGrade.toFixed(2),
        adj.toFixed(2),
        '#',
      ];
      csvLines.push(line.join(','));
    }

    return csvLines.join('\r\n'); // Windows CRLF required by UGA eLC Mac/Windows import spec
  }

  /**
   * Generates the Athena (Banner SIS) Final Grade Import Spreadsheet
   * Term Code format: 4-digit year + 08 (Fall), 02 (Spring), or 05 (Summer)
   */
  static exportAthenaFinalGradesCsv(
    sisTermCode: string,
    crn: string,
    rows: StudentGradebookRow[]
  ): string {
    if (!/^\d{4}(02|05|08)$/.test(sisTermCode)) {
      throw new Error(
        `Invalid Athena Term Code "${sisTermCode}". Expected YYYY08 (Fall), YYYY02 (Spring), or YYYY05 (Summer).`
      );
    }

    const headers = [
      'Term Code',
      'CRN',
      'OrgDefinedID',
      'Last Name',
      'First Name',
      'Final Adjusted Grade',
    ];

    const lines = [headers.join(',')];
    for (const row of rows) {
      const effectiveScore = row.adjustedFinalGrade ?? row.calculatedFinalGrade;
      const letterGrade = this.toPlusMinusLetterGrade(effectiveScore);
      lines.push(
        [
          sisTermCode,
          crn,
          row.orgDefinedId,
          `"${row.lastName}"`,
          `"${row.firstName}"`,
          letterGrade,
        ].join(',')
      );
    }

    return lines.join('\r\n');
  }
}