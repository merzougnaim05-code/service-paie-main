import { GrilleCategory, Job } from '../types';

/**
 * دالة حساب الزيادة الاستدلالية للدرجات (5% من الرقم الاستدلالي الأدنى لكل درجة)
 * طبقاً للمرسوم الرئاسي 07-304 والمراسيم المعدلة له
 */
export function computeEchelons(base: number): number[] {
  const ech: number[] = [];
  for (let i = 1; i <= 12; i++) {
    ech.push(Math.round(base * 0.05 * i));
  }
  return ech;
}

/**
 * 1. شبكة 2008 - 2021 (المرسوم الرئاسي رقم 07-304 المؤرخ في 29 سبتمبر 2007، الساري من 1 جانفي 2008)
 * النقطة الاستدلالية: 45 دج
 */
export const GRILLE_2008_2021: GrilleCategory[] = [
  { cat: '1', group: 'D', base: 200, ech: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120] },
  { cat: '2', group: 'D', base: 219, ech: [11, 22, 33, 44, 55, 66, 77, 88, 99, 110, 120, 131] },
  { cat: '3', group: 'D', base: 240, ech: [12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144] },
  { cat: '4', group: 'D', base: 263, ech: [13, 26, 39, 53, 66, 79, 92, 105, 118, 132, 145, 158] },
  { cat: '5', group: 'D', base: 288, ech: [14, 29, 43, 58, 72, 86, 101, 115, 130, 144, 158, 173] },
  { cat: '6', group: 'D', base: 315, ech: [16, 32, 47, 63, 79, 95, 110, 126, 142, 158, 173, 189] },
  { cat: '7', group: 'C', base: 348, ech: [17, 35, 52, 70, 87, 104, 122, 139, 157, 174, 191, 209] },
  { cat: '8', group: 'C', base: 379, ech: [19, 38, 57, 76, 95, 114, 133, 152, 171, 190, 208, 227] },
  { cat: '9', group: 'B', base: 418, ech: [21, 42, 63, 84, 105, 125, 146, 167, 188, 209, 230, 251] },
  { cat: '10', group: 'B', base: 453, ech: [23, 45, 68, 91, 113, 136, 159, 181, 204, 227, 249, 272] },
  { cat: '11', group: 'A', base: 498, ech: [25, 50, 75, 100, 125, 149, 174, 199, 224, 249, 274, 299] },
  { cat: '12', group: 'A', base: 537, ech: [27, 54, 81, 107, 134, 161, 188, 215, 242, 269, 295, 322] },
  { cat: '13', group: 'A', base: 578, ech: [29, 58, 87, 116, 145, 173, 202, 231, 260, 289, 318, 347] },
  { cat: '14', group: 'A', base: 621, ech: [31, 62, 93, 124, 155, 186, 217, 248, 279, 311, 342, 373] },
  { cat: '15', group: 'A', base: 666, ech: [33, 67, 100, 133, 167, 200, 233, 266, 300, 333, 366, 400] },
  { cat: '16', group: 'A', base: 713, ech: [36, 71, 107, 143, 178, 214, 250, 285, 321, 357, 392, 428] },
  { cat: '17', group: 'A', base: 762, ech: [38, 76, 114, 152, 191, 229, 267, 305, 343, 381, 419, 457] },
  { cat: 'خارج الفئة 1', group: 'خ.ف', base: 930, ech: [47, 93, 140, 186, 233, 279, 326, 372, 419, 465, 512, 558] },
  { cat: 'خارج الفئة 2', group: 'خ.ف', base: 990, ech: [50, 99, 149, 198, 248, 297, 347, 396, 446, 495, 545, 594] },
  { cat: 'خارج الفئة 3', group: 'خ.ف', base: 1055, ech: [53, 106, 158, 211, 264, 317, 369, 422, 475, 528, 580, 633] },
  { cat: 'خارج الفئة 4', group: 'خ.ف', base: 1125, ech: [56, 113, 169, 225, 281, 338, 394, 450, 506, 563, 619, 675] },
  { cat: 'خارج الفئة 5', group: 'خ.ف', base: 1200, ech: [60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660, 720] },
  { cat: 'خارج الفئة 6', group: 'خ.ف', base: 1280, ech: [64, 128, 192, 256, 320, 384, 448, 512, 576, 640, 704, 768] },
  { cat: 'خارج الفئة 7', group: 'خ.ف', base: 1480, ech: [74, 148, 222, 296, 370, 444, 518, 592, 666, 740, 814, 888] }
];

/**
 * 2. شبكة سنة 2022 (المرسوم الرئاسي رقم 22-138 المؤرخ في 31 مارس 2022، الساري من 1 مارس 2022)
 * زيادة 50 نقطة استدلالية لكل صنف وقسم فرعي
 */
export const GRILLE_2022: GrilleCategory[] = [
  { cat: '1', group: 'D', base: 250, ech: [13, 25, 38, 50, 63, 75, 88, 100, 113, 125, 138, 150] },
  { cat: '2', group: 'D', base: 269, ech: [13, 27, 40, 54, 67, 81, 94, 108, 121, 135, 148, 161] },
  { cat: '3', group: 'D', base: 290, ech: [15, 29, 44, 58, 73, 87, 102, 116, 131, 145, 160, 174] },
  { cat: '4', group: 'D', base: 313, ech: [16, 31, 47, 63, 78, 94, 110, 125, 141, 157, 172, 188] },
  { cat: '5', group: 'D', base: 338, ech: [17, 34, 51, 68, 85, 101, 118, 135, 152, 169, 186, 203] },
  { cat: '6', group: 'D', base: 365, ech: [18, 37, 55, 73, 91, 110, 128, 146, 164, 183, 201, 219] },
  { cat: '7', group: 'C', base: 398, ech: [20, 40, 60, 80, 100, 119, 139, 159, 179, 199, 219, 239] },
  { cat: '8', group: 'C', base: 429, ech: [21, 43, 64, 86, 107, 129, 150, 172, 193, 215, 236, 257] },
  { cat: '9', group: 'B', base: 468, ech: [23, 47, 70, 94, 117, 140, 164, 187, 211, 234, 257, 281] },
  { cat: '10', group: 'B', base: 503, ech: [25, 50, 75, 101, 126, 151, 176, 201, 226, 252, 277, 302] },
  { cat: '11', group: 'A', base: 548, ech: [27, 55, 82, 110, 137, 164, 192, 219, 247, 274, 301, 329] },
  { cat: '12', group: 'A', base: 587, ech: [29, 59, 88, 117, 147, 176, 205, 235, 264, 294, 323, 352] },
  { cat: '13', group: 'A', base: 628, ech: [31, 63, 94, 126, 157, 188, 220, 251, 283, 314, 345, 377] },
  { cat: '14', group: 'A', base: 671, ech: [34, 67, 101, 134, 168, 201, 235, 268, 302, 336, 369, 403] },
  { cat: '15', group: 'A', base: 716, ech: [36, 72, 107, 143, 179, 215, 251, 286, 322, 358, 394, 430] },
  { cat: '16', group: 'A', base: 763, ech: [38, 76, 114, 153, 191, 229, 267, 305, 343, 382, 420, 458] },
  { cat: '17', group: 'A', base: 812, ech: [41, 81, 122, 162, 203, 244, 284, 325, 365, 406, 447, 487] },
  { cat: 'خارج الفئة 1', group: 'خ.ف', base: 980, ech: [49, 98, 147, 196, 245, 294, 343, 392, 441, 490, 539, 588] },
  { cat: 'خارج الفئة 2', group: 'خ.ف', base: 1040, ech: [52, 104, 156, 208, 260, 312, 364, 416, 468, 520, 572, 624] },
  { cat: 'خارج الفئة 3', group: 'خ.ف', base: 1105, ech: [55, 111, 166, 221, 276, 332, 387, 442, 497, 553, 608, 663] },
  { cat: 'خارج الفئة 4', group: 'خ.ف', base: 1175, ech: [59, 118, 176, 235, 294, 353, 411, 470, 529, 588, 646, 705] },
  { cat: 'خارج الفئة 5', group: 'خ.ف', base: 1250, ech: [63, 125, 188, 250, 313, 375, 438, 500, 563, 625, 688, 750] },
  { cat: 'خارج الفئة 6', group: 'خ.ف', base: 1330, ech: [67, 133, 200, 266, 333, 399, 466, 532, 599, 665, 732, 798] },
  { cat: 'خارج الفئة 7', group: 'خ.ف', base: 1530, ech: [77, 153, 230, 306, 383, 459, 536, 612, 689, 765, 842, 918] }
];

/**
 * 3. شبكة سنة 2023 (المرسوم الرئاسي رقم 23-54 المؤرخ في 16 جانفي 2023 - المرحلة الأولى)
 * زيادة 75 نقطة استدلالية إضافية (+125 نقطة عن 2008)
 */
export const GRILLE_2023: GrilleCategory[] = [
  { cat: '1', group: 'D', base: 325, ech: [16, 33, 49, 65, 81, 98, 114, 130, 146, 163, 179, 195] },
  { cat: '2', group: 'D', base: 344, ech: [17, 34, 52, 69, 86, 103, 120, 138, 155, 172, 189, 206] },
  { cat: '3', group: 'D', base: 365, ech: [18, 37, 55, 73, 91, 110, 128, 146, 164, 183, 201, 219] },
  { cat: '4', group: 'D', base: 388, ech: [19, 39, 58, 78, 97, 116, 136, 155, 175, 194, 213, 233] },
  { cat: '5', group: 'D', base: 413, ech: [21, 41, 62, 83, 103, 124, 145, 165, 186, 207, 227, 248] },
  { cat: '6', group: 'D', base: 440, ech: [22, 44, 66, 88, 110, 132, 154, 176, 198, 220, 242, 264] },
  { cat: '7', group: 'C', base: 473, ech: [24, 47, 71, 95, 118, 142, 166, 189, 213, 237, 260, 284] },
  { cat: '8', group: 'C', base: 504, ech: [25, 50, 76, 101, 126, 151, 176, 202, 227, 252, 277, 302] },
  { cat: '9', group: 'B', base: 543, ech: [27, 54, 81, 109, 136, 163, 190, 217, 244, 272, 299, 326] },
  { cat: '10', group: 'B', base: 578, ech: [29, 58, 87, 116, 145, 173, 202, 231, 260, 289, 318, 347] },
  { cat: '11', group: 'A', base: 623, ech: [31, 62, 93, 125, 156, 187, 218, 249, 280, 312, 343, 374] },
  { cat: '12', group: 'A', base: 662, ech: [33, 66, 99, 132, 166, 199, 232, 265, 298, 331, 364, 397] },
  { cat: '13', group: 'A', base: 703, ech: [35, 70, 105, 141, 176, 211, 246, 281, 316, 352, 387, 422] },
  { cat: '14', group: 'A', base: 746, ech: [37, 75, 112, 149, 187, 224, 261, 298, 336, 373, 410, 448] },
  { cat: '15', group: 'A', base: 791, ech: [40, 79, 119, 158, 198, 237, 277, 316, 356, 396, 435, 475] },
  { cat: '16', group: 'A', base: 838, ech: [42, 84, 126, 168, 210, 251, 293, 335, 377, 419, 461, 503] },
  { cat: '17', group: 'A', base: 887, ech: [44, 89, 133, 177, 222, 266, 310, 355, 399, 444, 488, 532] },
  { cat: 'خارج الفئة 1', group: 'خ.ف', base: 1055, ech: [53, 106, 158, 211, 264, 317, 369, 422, 475, 528, 580, 633] },
  { cat: 'خارج الفئة 2', group: 'خ.ف', base: 1115, ech: [56, 112, 167, 223, 279, 335, 390, 446, 502, 558, 613, 669] },
  { cat: 'خارج الفئة 3', group: 'خ.ف', base: 1180, ech: [59, 118, 177, 236, 295, 354, 413, 472, 531, 590, 649, 708] },
  { cat: 'خارج الفئة 4', group: 'خ.ف', base: 1250, ech: [63, 125, 188, 250, 313, 375, 438, 500, 563, 625, 688, 750] },
  { cat: 'خارج الفئة 5', group: 'خ.ف', base: 1325, ech: [66, 133, 199, 265, 331, 398, 464, 530, 596, 663, 729, 795] },
  { cat: 'خارج الفئة 6', group: 'خ.ف', base: 1405, ech: [70, 141, 211, 281, 351, 422, 492, 562, 632, 703, 773, 843] },
  { cat: 'خارج الفئة 7', group: 'خ.ف', base: 1605, ech: [80, 161, 241, 321, 401, 482, 562, 642, 722, 803, 883, 963] }
];

/**
 * 4. شبكة سنوات 2024 - 2026 (المرسوم الرئاسي رقم 23-54 المؤرخ في 16 جانفي 2023 - المرحلة الثانية المستمرة)
 * زيادة 75 نقطة استدلالية أخرى (+200 نقطة إجمالاً عن 2008)
 */
export const GRILLE_2024_2026: GrilleCategory[] = [
  { cat: '1', group: 'D', base: 400, ech: [20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240] },
  { cat: '2', group: 'D', base: 419, ech: [21, 42, 63, 84, 105, 126, 147, 168, 189, 210, 230, 251] },
  { cat: '3', group: 'D', base: 440, ech: [22, 44, 66, 88, 110, 132, 154, 176, 198, 220, 242, 264] },
  { cat: '4', group: 'D', base: 463, ech: [23, 46, 69, 93, 116, 139, 162, 185, 208, 232, 255, 278] },
  { cat: '5', group: 'D', base: 488, ech: [24, 49, 73, 98, 122, 146, 171, 195, 220, 244, 268, 293] },
  { cat: '6', group: 'D', base: 515, ech: [26, 52, 77, 103, 129, 155, 180, 206, 232, 258, 283, 309] },
  { cat: '7', group: 'C', base: 548, ech: [27, 55, 82, 110, 137, 164, 192, 219, 247, 274, 301, 329] },
  { cat: '8', group: 'C', base: 579, ech: [29, 58, 87, 116, 145, 174, 203, 232, 261, 290, 318, 347] },
  { cat: '9', group: 'B', base: 618, ech: [31, 62, 93, 124, 155, 185, 216, 247, 278, 309, 340, 371] },
  { cat: '10', group: 'B', base: 653, ech: [33, 65, 98, 131, 163, 196, 229, 261, 294, 327, 359, 392] },
  { cat: '11', group: 'A', base: 698, ech: [35, 70, 105, 140, 175, 209, 244, 279, 314, 349, 384, 419] },
  { cat: '12', group: 'A', base: 737, ech: [37, 74, 111, 147, 184, 221, 258, 295, 332, 369, 405, 442] },
  { cat: '13', group: 'A', base: 778, ech: [39, 78, 117, 156, 195, 233, 272, 311, 350, 389, 428, 467] },
  { cat: '14', group: 'A', base: 821, ech: [41, 82, 123, 164, 205, 246, 287, 328, 369, 411, 452, 493] },
  { cat: '15', group: 'A', base: 866, ech: [43, 87, 130, 173, 217, 260, 303, 346, 390, 433, 476, 520] },
  { cat: '16', group: 'A', base: 913, ech: [46, 91, 137, 183, 228, 274, 320, 365, 411, 457, 502, 548] },
  { cat: '17', group: 'A', base: 962, ech: [48, 96, 144, 192, 241, 289, 337, 385, 433, 481, 529, 577] },
  { cat: 'خارج الفئة 1', group: 'خ.ف', base: 1130, ech: [57, 113, 170, 226, 283, 339, 396, 452, 509, 565, 622, 678] },
  { cat: 'خارج الفئة 2', group: 'خ.ف', base: 1190, ech: [60, 119, 179, 238, 298, 357, 417, 476, 536, 595, 655, 714] },
  { cat: 'خارج الفئة 3', group: 'خ.ف', base: 1255, ech: [63, 126, 188, 251, 314, 377, 439, 502, 565, 628, 690, 753] },
  { cat: 'خارج الفئة 4', group: 'خ.ف', base: 1325, ech: [66, 133, 199, 265, 331, 398, 464, 530, 596, 663, 729, 795] },
  { cat: 'خارج الفئة 5', group: 'خ.ف', base: 1400, ech: [70, 140, 210, 280, 350, 420, 490, 560, 630, 700, 770, 840] },
  { cat: 'خارج الفئة 6', group: 'خ.ف', base: 1480, ech: [74, 148, 222, 296, 370, 444, 518, 592, 666, 740, 814, 888] },
  { cat: 'خارج الفئة 7', group: 'خ.ف', base: 1680, ech: [84, 168, 252, 336, 420, 504, 588, 672, 756, 840, 924, 1008] }
];

// الشبكة الافتراضية الحالية (2024-2026) للتوافق مع المكونات السابقة
export const GRILLE: GrilleCategory[] = GRILLE_2024_2026;

/**
 * دالة استرجاع الشبكة الاستدلالية الرسمية بدقة حسب سنة العمليات
 */
export function getGrilleForYear(year: number): GrilleCategory[] {
  if (year < 2022) {
    return GRILLE_2008_2021;
  } else if (year === 2022) {
    return GRILLE_2022;
  } else if (year === 2023) {
    return GRILLE_2023;
  } else {
    return GRILLE_2024_2026;
  }
}

/**
 * بيانات الشبكة الاستدلالية المعتمدة حسب سنة الكشف (الاسم والمرسوم المرجعي)
 */
export function getGrilleLabelForYear(year: number): { name: string; decree: string } {
  if (year < 2022) return { name: 'شبكة 2008 - 2021', decree: 'المرسوم الرئاسي رقم 07-304' };
  if (year === 2022) return { name: 'شبكة 2022', decree: 'المرسوم الرئاسي رقم 22-138' };
  if (year === 2023) return { name: 'شبكة 2023', decree: 'المرسوم الرئاسي رقم 23-54 (المرحلة الأولى)' };
  return { name: 'شبكة 2024 - 2026', decree: 'المرسوم الرئاسي رقم 23-54 (المرحلة الثانية)' };
}

/**
 * المراحل التاريخية لتطور الرواتب والنقاط الاستدلالية منذ سنة 2008
 */
export interface HistoricalEra {
  id: string;
  name: string;
  period: string;
  startYear: number;
  endYear: number;
  decree: string;
  pointValue: number;
  bonusPoints: number;
  summary: string;
  allowancesRegime: string;
  highlights: string[];
}

export const HISTORICAL_ERAS: HistoricalEra[] = [
  {
    id: 'era-2008-2021',
    name: 'شبكة 2008 - 2021 الأصلية',
    period: '2008 — 2021',
    startYear: 2008,
    endYear: 2021,
    decree: 'المرسوم الرئاسي رقم 07-304 المؤرخ في 29 سبتمبر 2007 (ساري من 01-01-2008)',
    pointValue: 45,
    bonusPoints: 0,
    summary: 'الشبكة الاستدلالية المرجعية الأساسية: من 200 نقطة (صنف 1) إلى 762 نقطة (صنف 17).',
    allowancesRegime: 'المرسوم التنفيذي 10-78 (النظام التعويضي 2010 بأثر رجعي من 2008)، المرسوم التنفيذي 11-171 (الدعم المدرسي 2011)، المرسوم التنفيذي 15-176 (المنحة الجزافية 2015).',
    highlights: [
      'الرقم الاستدلالي الأدنى: 200 إلى 762 نقطة',
      'قيمة النقطة الاستدلالية: 45 دج ثابتة',
      'علاوة تحسين الأداء التربوي (المردودية): 40% تدفع فصلياً (المرسوم 10-78)',
      'تعويض التأهيل: 25% (أصناف ≤ 11) و 30% (أصناف ≥ 12)',
      'تعويض الخبرة البيداغوجية: 4% عن كل درجة للموظف',
      'تعويض التوثيق البيداغوجي: 2000 دج إلى 3000 دج شهرياً',
      'تعويض الدعم المدرسي والمعالجة البيداغوجية: 15% من الراتب الرئيسي (المرسوم 11-171 الصادر في 2011)',
      'تطبيق جدول الضريبة على الدخل الإجمالي القديم (معفى أقل من 15,000 دج)'
    ]
  },
  {
    id: 'era-2022',
    name: 'شبكة 2022 (+50 نقطة استدلالية)',
    period: '2022',
    startYear: 2022,
    endYear: 2022,
    decree: 'المرسوم الرئاسي رقم 22-138 المؤرخ في 31 مارس 2022 (ساري من 01-03-2022)',
    pointValue: 45,
    bonusPoints: 50,
    summary: 'زيادة 50 نقطة استدلالية في الرقم الاستدلالي الأدنى لكل صنف وقسم فرعي (250 إلى 812).',
    allowancesRegime: 'تطبيق قانون المالية 2022 مع سلم الضريبة الجديد على الدخل الإجمالي IRG (إعفاء حتى 30,000 دج).',
    highlights: [
      'الرقم الاستدلالي الأدنى: 250 إلى 812 نقطة (+50 نقطة)',
      'قيمة النقطة الاستدلالية: 45 دج ثابتة',
      'الزيادة الصافية الأساسية: 2,250 دج خام + أثرها على المنح المئوية',
      'تطبيق جدول الضريبة الجديد IRG 2022 بإعفاء كامل للأجور الأقل من 30,000 دج وتخفيضات تصاعدية'
    ]
  },
  {
    id: 'era-2023',
    name: 'شبكة 2023 (+75 نقطة استدلالية)',
    period: '2023',
    startYear: 2023,
    endYear: 2023,
    decree: 'المرسوم الرئاسي رقم 23-54 المؤرخ في 16 جانفي 2023 (المرحلة الأولى - سارية من 01-01-2023)',
    pointValue: 45,
    bonusPoints: 125,
    summary: 'زيادة 75 نقطة استدلالية إضافية (+125 نقطة عن شبكة 2008): من 325 إلى 887 نقطة.',
    allowancesRegime: 'استمرار النظام التعويضي وسلم الضريبة IRG 2022 مع الأثر المباشر لرفع النقطة على كافة المنح.',
    highlights: [
      'الرقم الاستدلالي الأدنى: 325 إلى 887 نقطة (+75 نقطة إضافية عن 2022)',
      'قيمة النقطة الاستدلالية: 45 دج ثابتة',
      'الزيادة التراكمية مقارنة بـ 2008: +125 نقطة استدلالية (5,625 دج في الأساسي)'
    ]
  },
  {
    id: 'era-2024-2026',
    name: 'شبكة 2024 - 2026 (+75 نقطة أخرى والنظام التعويضي 2025)',
    period: '2024 — 2026',
    startYear: 2024,
    endYear: 2026,
    decree: 'المرسوم الرئاسي رقم 23-54 (المرحلة الثانية - سارية من 01-01-2024) والمرسوم التنفيذي 25-55 (21 جانفي 2025)',
    pointValue: 45,
    bonusPoints: 200,
    summary: 'زيادة 75 نقطة استدلالية أخرى (+200 نقطة إجمالاً عن 2008): من 400 إلى 962 نقطة، والنظام التعويضي الجديد لقطاع التربية 2025.',
    allowancesRegime: 'المرسوم التنفيذي 25-55 المؤرخ في 21 جانفي 2025 (رفع الدعم المدرسي إلى 45% و 30%، ورفع التأهيل إلى 40%-45%)، وتحديثات الخدمات الاجتماعية 2026.',
    highlights: [
      'الرقم الاستدلالي الأدنى: 400 إلى 962 نقطة (+200 نقطة تراكمية عن شبكة 2008)',
      'قيمة النقطة الاستدلالية: 45 دج ثابتة',
      'المرسوم التنفيذي 25-55 (جانفي 2025): رفع تعويض الدعم المدرسي والمعالجة البيداغوجية إلى 45% لأساتذة التعليم، 30% للمشرفين، 15% للمصالح الاقتصادية والمخابر',
      'رفع تعويض التأهيل إلى 40% (أصناف ≤ 12) و 45% (أصناف ≥ 13)',
      'خدمات اجتماعية محينة 2026: منحة الزواج 50,000 دج، منحة التقاعد 320,000 دج، الأيتام 20,000/15,000 دج، وفاة أحد الوالدين 20,000 دج'
    ]
  }
];

/**
 * منح الخدمات الاجتماعية المحينة لقطاع التربية الوطنية (فيفري 2026)
 */
export const SOCIAL_SERVICES_2026 = [
  { name: 'منحة التقاعد', previousAmount: 250000, newAmount: 320000, unit: 'دج', note: '32 مليون سنتيم عند الإحالة على التقاعد' },
  { name: 'منحة الزواج', previousAmount: 30000, newAmount: 50000, unit: 'دج', note: '5 ملايين سنتيم بمناسبة عقد القران' },
  { name: 'منحة الأيتام (يتيم الأبوين)', previousAmount: 15000, newAmount: 20000, unit: 'دج', note: 'منحة تضامنية سنوية' },
  { name: 'منحة الأيتام (يتيم أحد الأبوين)', previousAmount: 10000, newAmount: 15000, unit: 'دج', note: 'منحة تضامنية سنوية' },
  { name: 'منحة وفاة أحد الوالدين', previousAmount: 10000, newAmount: 20000, unit: 'دج', note: 'مساعدة اجتماعية عند وفاة الأب أو الأم' },
  { name: 'منحة وفاة القرين أو أحد الأبناء', previousAmount: 15000, newAmount: 25000, unit: 'دج', note: 'مساعدة اجتماعية' }
];

export const GRID1989 = [
  { code: 'A11', base: 1500, minIndex: 102, ech: [6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 51, 51] },
  { code: 'A21', base: 1520, minIndex: 106, ech: [6, 12, 18, 23, 28, 33, 38, 43, 48, 53, 53, 53] },
  { code: 'A31', base: 1540, minIndex: 110, ech: [6, 12, 18, 24, 30, 35, 40, 45, 50, 55, 55, 55] },
  { code: 'A12', base: 1560, minIndex: 114, ech: [6, 12, 18, 24, 30, 36, 42, 47, 52, 57, 57, 57] },
  { code: 'A22', base: 1580, minIndex: 118, ech: [6, 12, 18, 24, 30, 36, 42, 48, 54, 59, 59, 59] },
  { code: 'A32', base: 1600, minIndex: 122, ech: [7, 13, 19, 25, 31, 37, 43, 49, 55, 61, 61, 61] },
  { code: 'A13', base: 1620, minIndex: 126, ech: [7, 14, 21, 27, 33, 39, 45, 51, 57, 63, 63, 63] },
  { code: 'A23', base: 1640, minIndex: 130, ech: [7, 14, 21, 28, 35, 41, 47, 53, 59, 65, 65, 65] },
  { code: 'A33', base: 1660, minIndex: 134, ech: [7, 14, 21, 28, 35, 42, 49, 55, 61, 67, 67, 67] },
  { code: 'A14', base: 1680, minIndex: 139, ech: [7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 70, 70] },
  { code: 'A24', base: 1700, minIndex: 144, ech: [8, 16, 23, 30, 37, 44, 51, 58, 65, 72, 72, 72] },
  { code: 'A34', base: 1745, minIndex: 149, ech: [8, 16, 24, 32, 40, 47, 54, 61, 68, 75, 75, 75] },
  { code: 'A15', base: 1790, minIndex: 154, ech: [8, 16, 24, 32, 40, 48, 56, 63, 70, 77, 77, 77] },
  { code: 'A25', base: 1850, minIndex: 160, ech: [8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 80, 80] },
  { code: 'A35', base: 1910, minIndex: 166, ech: [9, 18, 27, 35, 43, 51, 59, 67, 75, 83, 83, 83] },
  { code: 'A16', base: 1970, minIndex: 172, ech: [9, 18, 27, 36, 45, 54, 62, 70, 78, 86, 86, 86] },
  { code: 'A26', base: 2040, minIndex: 179, ech: [9, 18, 27, 36, 45, 54, 63, 72, 81, 90, 90, 90] },
  { code: 'A36', base: 2100, minIndex: 185, ech: [10, 20, 30, 39, 48, 57, 66, 75, 84, 93, 93, 93] },
  { code: 'A17', base: 2170, minIndex: 192, ech: [10, 20, 30, 40, 50, 60, 69, 78, 87, 96, 96, 96] },
  { code: 'A27', base: 2240, minIndex: 199, ech: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 100, 100] },
  { code: 'A37', base: 2300, minIndex: 205, ech: [11, 22, 33, 43, 53, 63, 73, 83, 93, 103, 103, 103] },
  { code: 'A18', base: 2380, minIndex: 213, ech: [11, 22, 33, 44, 55, 66, 77, 87, 97, 107, 107, 107] },
  { code: 'A28', base: 2460, minIndex: 221, ech: [12, 23, 34, 45, 56, 67, 78, 89, 100, 111, 111, 111] },
  { code: 'A38', base: 2530, minIndex: 228, ech: [12, 24, 36, 48, 59, 70, 81, 92, 103, 114, 114, 114] },
  { code: 'A19', base: 2610, minIndex: 236, ech: [12, 24, 36, 48, 60, 72, 84, 96, 107, 118, 118, 118] },
  { code: 'A29', base: 2700, minIndex: 245, ech: [13, 26, 39, 51, 63, 75, 87, 99, 111, 123, 123, 123] },
  { code: 'A39', base: 2780, minIndex: 253, ech: [13, 26, 39, 52, 65, 78, 91, 103, 115, 127, 127, 127] },
  { code: 'A110', base: 2850, minIndex: 260, ech: [13, 26, 39, 52, 65, 78, 91, 104, 117, 130, 130, 130] },
  { code: 'A210', base: 2920, minIndex: 267, ech: [14, 28, 42, 56, 69, 82, 95, 108, 121, 134, 134, 134] },
  { code: 'A310', base: 2990, minIndex: 274, ech: [14, 28, 42, 56, 70, 84, 98, 111, 124, 137, 137, 137] },
  { code: 'A410', base: 3060, minIndex: 281, ech: [15, 29, 43, 57, 71, 85, 99, 113, 127, 141, 141, 141] },
  { code: 'A111', base: 3070, minIndex: 288, ech: [15, 30, 45, 60, 74, 88, 102, 116, 130, 144, 144, 144] },
  { code: 'A211', base: 3130, minIndex: 296, ech: [15, 30, 45, 60, 75, 90, 105, 120, 134, 148, 148, 148] },
  { code: 'A311', base: 3190, minIndex: 304, ech: [16, 32, 47, 62, 77, 92, 107, 122, 137, 152, 152, 152] },
  { code: 'A411', base: 3250, minIndex: 312, ech: [16, 32, 48, 64, 80, 96, 111, 126, 141, 156, 156, 156] },
  { code: 'A112', base: 3320, minIndex: 320, ech: [16, 32, 48, 64, 80, 96, 112, 128, 144, 160, 160, 160] },
  { code: 'A212', base: 3380, minIndex: 328, ech: [17, 34, 51, 68, 84, 100, 116, 132, 148, 164, 164, 164] },
  { code: 'A312', base: 3450, minIndex: 336, ech: [17, 34, 51, 68, 85, 102, 119, 136, 152, 168, 168, 168] },
  { code: 'A412', base: 3530, minIndex: 345, ech: [18, 36, 54, 71, 88, 105, 122, 139, 156, 173, 173, 173] },
  { code: 'A113', base: 3540, minIndex: 354, ech: [18, 36, 54, 72, 90, 108, 126, 143, 160, 177, 177, 177] },
  { code: 'A213', base: 3640, minIndex: 364, ech: [19, 38, 56, 74, 92, 110, 128, 146, 164, 182, 182, 182] },
  { code: 'A313', base: 3730, minIndex: 373, ech: [19, 38, 57, 76, 95, 114, 133, 151, 169, 187, 187, 187] },
  { code: 'A413', base: 3830, minIndex: 383, ech: [20, 40, 59, 78, 97, 116, 135, 154, 173, 192, 192, 192] },
  { code: 'A114', base: 3920, minIndex: 392, ech: [20, 40, 60, 80, 100, 120, 139, 158, 177, 196, 196, 196] },
  { code: 'A214', base: 4000, minIndex: 400, ech: [20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 200, 200] },
  { code: 'A314', base: 4080, minIndex: 408, ech: [21, 42, 63, 84, 104, 124, 144, 164, 184, 204, 204, 204] },
  { code: 'A414', base: 4160, minIndex: 416, ech: [21, 42, 63, 84, 105, 126, 147, 168, 188, 208, 208, 208] },
  { code: 'A514', base: 4240, minIndex: 424, ech: [22, 44, 65, 86, 107, 128, 149, 170, 191, 212, 212, 212] },
  { code: 'A115', base: 4340, minIndex: 434, ech: [22, 44, 66, 88, 110, 132, 154, 175, 196, 217, 217, 217] },
  { code: 'A215', base: 4430, minIndex: 443, ech: [23, 46, 68, 90, 112, 134, 156, 178, 200, 222, 222, 222] },
  { code: 'A315', base: 4520, minIndex: 452, ech: [23, 46, 69, 92, 115, 138, 160, 182, 204, 226, 226, 226] },
  { code: 'A415', base: 4620, minIndex: 462, ech: [24, 47, 70, 93, 116, 139, 162, 185, 208, 231, 231, 231] },
  { code: 'A515', base: 4720, minIndex: 472, ech: [24, 48, 72, 96, 120, 144, 167, 190, 213, 236, 236, 236] },
  { code: 'A116', base: 4820, minIndex: 482, ech: [25, 49, 73, 97, 121, 145, 169, 193, 217, 241, 241, 241] },
  { code: 'A216', base: 4920, minIndex: 492, ech: [25, 50, 75, 100, 125, 150, 174, 198, 222, 246, 246, 246] },
  { code: 'A316', base: 5020, minIndex: 502, ech: [26, 51, 76, 101, 126, 151, 176, 201, 226, 251, 251, 251] },
  { code: 'A416', base: 5120, minIndex: 512, ech: [26, 52, 78, 104, 130, 156, 181, 206, 231, 256, 256, 256] },
  { code: 'A516', base: 5220, minIndex: 522, ech: [27, 53, 79, 105, 131, 157, 183, 209, 235, 261, 261, 261] },
  { code: 'A117', base: 5340, minIndex: 534, ech: [27, 54, 81, 108, 135, 162, 189, 215, 241, 267, 267, 267] },
  { code: 'A217', base: 5450, minIndex: 545, ech: [28, 56, 84, 111, 138, 165, 192, 219, 246, 273, 273, 273] },
  { code: 'A317', base: 5560, minIndex: 556, ech: [28, 56, 84, 112, 140, 168, 196, 224, 251, 278, 278, 278] },
  { code: 'A417', base: 5690, minIndex: 569, ech: [29, 58, 87, 116, 145, 173, 201, 229, 257, 285, 285, 285] },
  { code: 'A517', base: 5810, minIndex: 581, ech: [30, 59, 88, 117, 146, 175, 204, 233, 262, 291, 291, 291] },
  { code: 'A118', base: 5930, minIndex: 593, ech: [30, 60, 90, 120, 150, 180, 210, 239, 268, 297, 297, 297] },
  { code: 'A218', base: 6060, minIndex: 606, ech: [31, 62, 93, 123, 153, 183, 213, 243, 273, 303, 303, 303] },
  { code: 'A318', base: 6190, minIndex: 619, ech: [31, 62, 93, 124, 155, 186, 217, 248, 279, 310, 310, 310] },
  { code: 'A418', base: 6320, minIndex: 632, ech: [32, 64, 96, 128, 160, 192, 223, 254, 285, 316, 316, 316] },
  { code: 'A518', base: 6450, minIndex: 645, ech: [33, 66, 99, 131, 163, 195, 227, 259, 291, 323, 323, 323] },
  { code: 'A119', base: 6580, minIndex: 658, ech: [33, 66, 99, 132, 165, 198, 231, 264, 297, 329, 329, 329] },
  { code: 'A219', base: 6720, minIndex: 672, ech: [34, 68, 102, 136, 170, 204, 237, 270, 303, 336, 336, 336] },
  { code: 'A319', base: 6860, minIndex: 686, ech: [35, 70, 105, 139, 173, 207, 241, 275, 309, 343, 343, 343] },
  { code: 'A419', base: 7000, minIndex: 700, ech: [35, 70, 105, 140, 175, 210, 245, 280, 315, 350, 350, 350] },
  { code: 'A519', base: 7140, minIndex: 714, ech: [36, 72, 108, 144, 180, 216, 252, 287, 322, 357, 357, 357] },
  { code: 'A120', base: 7300, minIndex: 730, ech: [37, 74, 111, 148, 185, 221, 257, 293, 329, 365, 365, 365] },
  { code: 'A220', base: 7460, minIndex: 746, ech: [38, 76, 114, 151, 188, 225, 262, 299, 336, 373, 373, 373] },
  { code: 'A320', base: 7620, minIndex: 762, ech: [39, 77, 115, 153, 191, 229, 267, 305, 343, 381, 381, 381] },
  { code: 'A420', base: 7780, minIndex: 778, ech: [39, 78, 117, 156, 195, 234, 273, 312, 351, 389, 389, 389] },
  { code: 'A520', base: 7940, minIndex: 794, ech: [40, 80, 120, 160, 200, 240, 280, 319, 358, 397, 397, 397] }
];

export const JOBS: Job[] = [
  { name: 'معلم مدرسة ابتدائية', cat: 10, domain: 'teach', directorType: null, code: 1010, prevcat: 13, sect: 2, auresCode: 'A213' },
  { name: 'أستاذ التعليم الابتدائي', cat: 12, domain: 'teach', directorType: null, code: 1020, prevcat: 13, sect: 2, auresCode: 'A213' },
  { name: 'أستاذ التعليم الابتدائي قسم أول', cat: 13, domain: 'teach', directorType: null, code: 1030, prevcat: 14, sect: 2, auresCode: 'A514' },
  { name: 'أستاذ التعليم الابتدائي قسم ثان', cat: 14, domain: 'teach', directorType: null, code: 1050, prevcat: 13, sect: 2, auresCode: 'A213' },
  { name: 'أستاذ مميز في التعليم الابتدائي', cat: 15, domain: 'teach', directorType: null, code: 1061, prevcat: 13, sect: 2, auresCode: 'A213' },
  { name: 'أستاذ التعليم الأساسي', cat: 11, domain: 'teach', directorType: null, code: 1070, prevcat: 14, sect: 1, auresCode: 'A114' },
  { name: 'أستاذ التعليم المتوسط', cat: 12, domain: 'teach', directorType: null, code: 1080, prevcat: 14, sect: 1, auresCode: 'A114' },
  { name: 'أستاذ التعليم المتوسط قسم أول', cat: 13, domain: 'teach', directorType: null, code: 1090, prevcat: 14, sect: 1, auresCode: 'A114' },
  { name: 'أستاذ التعليم المتوسط قسم ثان', cat: 15, domain: 'teach', directorType: null, code: 1100, prevcat: 14, sect: 1, auresCode: 'A114' },
  { name: 'أستاذ مميز في التعليم المتوسط', cat: 16, domain: 'teach', directorType: null, code: 1110, prevcat: 14, sect: 1, auresCode: 'A114' },
  { name: 'أستاذ التعليم الثانوي', cat: 13, domain: 'teach', directorType: null, code: 1180, prevcat: 15, sect: 3, auresCode: 'A315' },
  { name: 'أستاذ التعليم الثانوي قسم أول', cat: 14, domain: 'teach', directorType: null, code: 1190, prevcat: 15, sect: 3, auresCode: 'A315' },
  { name: 'أستاذ التعليم الثانوي قسم ثان', cat: 16, domain: 'teach', directorType: null, code: 1200, prevcat: 15, sect: 3, auresCode: 'A315' },
  { name: 'أستاذ مميز في التعليم الثانوي', cat: 17, domain: 'teach', directorType: null, code: 1230, prevcat: 15, sect: 3, auresCode: 'A315' },
  { name: 'مدير المدرسة الابتدائية', cat: 15, domain: 'teach', directorType: 'ابتدائية', code: 1130, prevcat: 14, sect: 3, auresCode: 'A314' },
  { name: 'مدير المتوسطة', cat: 16, domain: 'teach', directorType: 'متوسطة', code: 1140, prevcat: 16, sect: 2, auresCode: 'A216' },
  { name: 'مدير الثانوية', cat: 17, domain: 'teach', directorType: 'ثانوية', code: 1150, prevcat: 17, sect: 3, auresCode: 'A317' },
  { name: 'مفتش التعليم الابتدائي تخصص المواد', cat: 17, domain: 'teach', directorType: null, code: 1340, prevcat: 16, sect: 5 },
  { name: 'مفتش التعليم الابتدائي تخصص إدارة المدارس الابتدائية', cat: 17, domain: 'teach', directorType: null, code: 1340, prevcat: 16, sect: 5 },
  { name: 'مفتش التعليم الابتدائي تخصص التغذية المدرسية', cat: 17, domain: 'teach', directorType: null, code: 1340, prevcat: 16, sect: 5 },
  { name: 'مفتش التعليم المتوسط تخصص المواد', cat: 17, domain: 'teach', directorType: null, code: 1360, prevcat: 16, sect: 5 },
  { name: 'مفتش التعليم المتوسط تخصص إدارة المتوسطات', cat: 17, domain: 'teach', directorType: null, code: 1360, prevcat: 16, sect: 5 },
  { name: 'مفتش التعليم الثانوي تخصص المواد', cat: 'خارج الفئة 1', domain: 'teach', directorType: null, code: 1360, prevcat: 16, sect: 5 },
  { name: 'مفتش التعليم الثانوي تخصص إدارة الثانويات', cat: 'خارج الفئة 1', domain: 'teach', directorType: null, code: 1360, prevcat: 16, sect: 5 },
  { name: 'مفتش التربية الوطنية', cat: 'خارج الفئة 2', domain: 'teach', directorType: null, code: 1370, prevcat: 18, sect: 2 },
  { name: 'ناظر في التعليم الابتدائي', cat: 14, domain: 'edu', directorType: null, code: 1110, prevcat: 13, sect: 2 },
  { name: 'ناظر في التعليم المتوسط', cat: 15, domain: 'edu', directorType: null, code: 1300, prevcat: 16, sect: 2 },
  { name: 'ناظر في التعليم الثانوي', cat: 16, domain: 'edu', directorType: null, code: 1400, prevcat: 17, sect: 3 },
  { name: 'مستشار التربية', cat: 13, domain: 'edu', directorType: null, code: 9270, prevcat: 14, sect: 3, auresCode: 'A314' },
  { name: 'مساعد التربية', cat: 7, domain: 'edu', directorType: null, code: 9230, prevcat: 11, sect: 1, auresCode: 'A111' },
  { name: 'مساعد رئيسي للتربية', cat: 8, domain: 'edu', directorType: null, code: 9240, prevcat: 11, sect: 1, auresCode: 'A111' },
  { name: 'مشرف التربية', cat: 10, domain: 'edu', directorType: null, code: 9250, prevcat: 11, sect: 1, auresCode: 'A111' },
  { name: 'مشرف رئيسي للتربية', cat: 11, domain: 'edu', directorType: null, code: 9260, prevcat: 11, sect: 1, auresCode: 'A111' },
  { name: 'مشرف رئيس', cat: 12, domain: 'edu', directorType: null, code: 9280, prevcat: 11, sect: 1, auresCode: 'A111' },
  { name: 'مشرف عام للتربية', cat: 13, domain: 'edu', directorType: null, code: 9262, prevcat: 11, sect: 1, auresCode: 'A111' },
  { name: 'مربي متخصص في الدعم التربوي', cat: 10, domain: 'edu', directorType: null, code: 9241, prevcat: 11, sect: 1, auresCode: 'A111' },
  { name: 'مربي متخصص رئيسي في الدعم التربوي', cat: 11, domain: 'edu', directorType: null, code: 9242, prevcat: 11, sect: 1, auresCode: 'A111' },
  { name: 'مربي متخصص رئيس في الدعم التربوي', cat: 12, domain: 'edu', directorType: null, code: 9242, prevcat: 11, sect: 1, auresCode: 'A111' },
  { name: 'مربي متخصص عام في الدعم التربوي', cat: 13, domain: 'edu', directorType: null, code: 9244, prevcat: 14, sect: 3, auresCode: 'A314' },
  { name: 'مستشار التوجيه والإرشاد المدرسي والمهني', cat: 12, domain: 'edu', directorType: null, code: 9320, prevcat: 14, sect: 5, auresCode: 'A514' },
  { name: 'مستشار محلل للتوجيه والإرشاد المدرسي والمهني', cat: 13, domain: 'edu', directorType: null, code: 9320, prevcat: 14, sect: 5, auresCode: 'A514' },
  { name: 'مستشار رئيسي للتوجيه والإرشاد المدرسي والمهني', cat: 14, domain: 'edu', directorType: null, code: 9330, prevcat: 14, sect: 5, auresCode: 'A514' },
  { name: 'مستشار رئيس للتوجيه والإرشاد المدرسي والمهني', cat: 16, domain: 'edu', directorType: null, code: 9330, prevcat: 14, sect: 5, auresCode: 'A514' },
  { name: 'مستشار التغذية المدرسية', cat: 12, domain: 'edu', directorType: null, code: 1120, prevcat: 13, sect: 4, auresCode: 'A413' },
  { name: 'مستشار رئيسي في التغذية المدرسية', cat: 13, domain: 'edu', directorType: null, code: 1120, prevcat: 13, sect: 4, auresCode: 'A413' },
  { name: 'مستشار رئيس في التغذية المدرسية', cat: 14, domain: 'edu', directorType: null, code: 1120, prevcat: 13, sect: 4, auresCode: 'A413' },
  { name: 'مفتش التوجيه والإرشاد المدرسي والمهني في المتوسطات', cat: 17, domain: 'edu', directorType: null, code: 1350, prevcat: 16, sect: 5 },
  { name: 'مفتش التوجيه والإرشاد المدرسي والمهني في الثانويات', cat: 'خارج الفئة 1', domain: 'edu', directorType: null, code: 1350, prevcat: 16, sect: 5 },
  { name: 'مساعد المصالح الاقتصادية', cat: 7, domain: 'eco', directorType: null, code: 2000, prevcat: 10, sect: 4, auresCode: 'A410' },
  { name: 'مساعد رئيسي للمصالح الاقتصادية', cat: 8, domain: 'eco', directorType: null, code: 2010, prevcat: 10, sect: 4, auresCode: 'A410' },
  { name: 'نائب مقتصد', cat: 10, domain: 'eco', directorType: null, code: 2020, prevcat: 12, sect: 4, auresCode: 'A412' },
  { name: 'نائب مقتصد مسير', cat: 11, domain: 'eco', directorType: null, code: 2030, prevcat: 13, sect: 4, auresCode: 'A413' },
  { name: 'مقتصد', cat: 13, domain: 'eco', directorType: null, code: 2040, prevcat: 15, sect: 1, auresCode: 'A115' },
  { name: 'مقتصد رئيسي', cat: 14, domain: 'eco', directorType: null, code: 2050, prevcat: 16, sect: 1, auresCode: 'A116' },
  { name: 'مفتش التسيير المالي والمادي في المتوسطات', cat: 16, domain: 'eco', directorType: null, code: 1360, prevcat: 16, sect: 5 },
  { name: 'مفتش التسيير المالي والمادي في الثانويات', cat: 17, domain: 'eco', directorType: null, code: 1360, prevcat: 16, sect: 5 },
  { name: 'عون تقني للمخابر', cat: 5, domain: 'lab', directorType: null, code: 3010, prevcat: 10, sect: 1 },
  { name: 'معاون تقني للمخابر', cat: 7, domain: 'lab', directorType: null, code: 3020, prevcat: 11, sect: 3 },
  { name: 'ملحق بالمخابر', cat: 8, domain: 'lab', directorType: null, code: 3030, prevcat: 13, sect: 1 },
  { name: 'ملحق رئيسي بالمخابر', cat: 10, domain: 'lab', directorType: null, code: 3040, prevcat: 14, sect: 1 },
  { name: 'ملحق رئيس بالمخابر', cat: 11, domain: 'lab', directorType: null, code: 3040, prevcat: 14, sect: 1 },
  { name: 'ملحق مشرف بالمخابر', cat: 12, domain: 'lab', directorType: null, code: 3040, prevcat: 14, sect: 1 },
  { name: 'مساعد تقني للمخابر', cat: 4, domain: 'lab', directorType: null, code: 3000, prevcat: null, sect: null },
  { name: 'وثائقي أمين محفوظات', cat: 12, domain: 'other', directorType: null, code: 4000, prevcat: 15, sect: 1 },
  { name: 'وثائقي أمين محفوظات رئيسي', cat: 14, domain: 'other', directorType: null, code: 4010, prevcat: 15, sect: 1 },
  { name: 'رئيس الوثائقيين أمناء المحفوظات', cat: 16, domain: 'other', directorType: null, code: 4020, prevcat: 15, sect: 1 },
  { name: 'مساعد وثائقي أمين محفوظات', cat: 10, domain: 'other', directorType: null, code: 4030, prevcat: 13, sect: 1 },
  { name: 'عون تقني في الوثائق والمحفوظات', cat: 7, domain: 'other', directorType: null, code: 4040, prevcat: 10, sect: 1 },
  { name: 'متصرف', cat: 12, domain: 'other', directorType: null, code: 4050, prevcat: 15, sect: 1, auresCode: 'A115' },
  { name: 'متصرف محلل', cat: 13, domain: 'other', directorType: null, code: 4055, prevcat: 15, sect: 1, auresCode: 'A115' },
  { name: 'متصرف رئيسي', cat: 14, domain: 'other', directorType: null, code: 4060, prevcat: 17, sect: 1, auresCode: 'A117' },
  { name: 'متصرف مستشار', cat: 16, domain: 'other', directorType: null, code: 4070, prevcat: 17, sect: 1, auresCode: 'A117' },
  { name: 'ملحق الإدارة', cat: 9, domain: 'other', directorType: null, code: 4080, prevcat: 13, sect: 1, auresCode: 'A113' },
  { name: 'ملحق رئيسي للإدارة', cat: 10, domain: 'other', directorType: null, code: 4090, prevcat: 14, sect: 1, auresCode: 'A114' },
  { name: 'عون مكتب', cat: 5, domain: 'other', directorType: null, code: 4100, prevcat: 8, sect: 1, auresCode: 'A18' },
  { name: 'عون إدارة', cat: 7, domain: 'other', directorType: null, code: 4110, prevcat: 10, sect: 1, auresCode: 'A110' },
  { name: 'عون إدارة رئيسي', cat: 8, domain: 'other', directorType: null, code: 4120, prevcat: 11, sect: 3, auresCode: 'A311' },
  { name: 'عون حفظ البيانات', cat: 5, domain: 'other', directorType: null, code: 4130, prevcat: 8, sect: 3, auresCode: 'A38' },
  { name: 'كاتب', cat: 6, domain: 'other', directorType: null, code: 4140, prevcat: 9, sect: 2, auresCode: 'A29' },
  { name: 'كاتب مديرية', cat: 8, domain: 'other', directorType: null, code: 4150, prevcat: 11, sect: 3, auresCode: 'A311' },
  { name: 'كاتب مديرية رئيسي', cat: 10, domain: 'other', directorType: null, code: 4160, prevcat: 13, sect: 3, auresCode: 'A313' },
  { name: 'مساعد محاسب إداري', cat: 5, domain: 'other', directorType: null, code: 4170, prevcat: 10, sect: 1, auresCode: 'A110' },
  { name: 'محاسب إداري', cat: 8, domain: 'other', directorType: null, code: 4180, prevcat: 11, sect: 3, auresCode: 'A311' },
  { name: 'محاسب إداري رئيسي', cat: 10, domain: 'other', directorType: null, code: 4190, prevcat: 14, sect: 1, auresCode: 'A114' },
  { name: 'المهندسون التطبيقيون', cat: 11, domain: 'other', directorType: null, code: 5000, prevcat: 15, sect: 1, auresCode: 'A115' },
  { name: 'مهندسو الدولة', cat: 13, domain: 'other', directorType: null, code: 5010, prevcat: 16, sect: 1, auresCode: 'A116' },
  { name: 'المهندسون الرئيسيون', cat: 14, domain: 'other', directorType: null, code: 5020, prevcat: 16, sect: 1, auresCode: 'A116' },
  { name: 'رئيس المهندسين', cat: 16, domain: 'other', directorType: null, code: 5030, prevcat: 16, sect: 1, auresCode: 'A116' },
  { name: 'تقني', cat: 8, domain: 'other', directorType: null, code: 5040, prevcat: 13, sect: 1, auresCode: 'A113' },
  { name: 'تقني سام', cat: 10, domain: 'other', directorType: null, code: 5050, prevcat: 14, sect: 1, auresCode: 'A114' },
  { name: 'معاون تقني', cat: 7, domain: 'other', directorType: null, code: 5060, prevcat: 11, sect: 3, auresCode: 'A311' },
  { name: 'عون تقني', cat: 5, domain: 'other', directorType: null, code: 5070, prevcat: 10, sect: 1, auresCode: 'A110' },
  { name: 'عامل مهني من الصنف الثالث', cat: 1, domain: 'other', directorType: null, code: 6000, prevcat: 6, sect: 3 },
  { name: 'عامل مهني من الصنف الثاني', cat: 3, domain: 'other', directorType: null, code: 6010, prevcat: 8, sect: 3 },
  { name: 'عامل مهني من الصنف الأول', cat: 5, domain: 'other', directorType: null, code: 6020, prevcat: 10, sect: 1 },
  { name: 'عامل مهني خارج الصنف', cat: 6, domain: 'other', directorType: null, code: 6030, prevcat: 11, sect: 2 },
  { name: 'عامل مهني من المستوي الأول', cat: 1, domain: 'other', directorType: null, code: 'O7000', prevcat: 6, sect: 3 },
  { name: 'عون الخدمة من المستوى الأول', cat: 1, domain: 'other', directorType: null, code: 'O7010', prevcat: 6, sect: 3 },
  { name: 'عامل مهني من المستوي الثاني', cat: 3, domain: 'other', directorType: null, code: 'O7040', prevcat: 8, sect: 3 },
  { name: 'عون الخدمة من المستوى الثاني', cat: 3, domain: 'other', directorType: null, code: 'O7060', prevcat: 10, sect: 1 },
  { name: 'عامل مهني من المستوى الثالث', cat: 5, domain: 'other', directorType: null, code: 'O7080', prevcat: 10, sect: 1 },
  { name: 'عون الخدمة من المستوى الثالث', cat: 5, domain: 'other', directorType: null, code: 'O7090', prevcat: 10, sect: 1 },
  { name: 'عامل مهني من المستوى الرابع', cat: 6, domain: 'other', directorType: null, code: 'O7110', prevcat: 11, sect: 2 },
  { name: 'عون الوقاية من المستوى الأول', cat: 5, domain: 'other', directorType: null, code: 'P7100', prevcat: 10, sect: 1 },
  { name: 'عون الوقاية من المستوى الثاني', cat: 7, domain: 'other', directorType: null, code: 'P7120', prevcat: 10, sect: 2 },
  { name: 'حارس', cat: 1, domain: 'other', directorType: null, code: 'B7020', prevcat: 6, sect: 3 },
  { name: 'سائق السيارة من المستوى الأول', cat: 2, domain: 'other', directorType: null, code: 'B7030', prevcat: 9, sect: 1 },
  { name: 'سائق السيارة من المستوى الثاني', cat: 3, domain: 'other', directorType: null, code: 'B7050', prevcat: 10, sect: 1 },
  { name: 'سائق السيارة من المستوى الثالث ورئيس حظيرة', cat: 4, domain: 'other', directorType: null, code: 'B7070', prevcat: 11, sect: 1 },
  { name: 'حاجب', cat: 1, domain: 'other', directorType: null, code: 'V6060', prevcat: 6, sect: 3 },
  { name: 'حاجب رئيسي', cat: 2, domain: 'other', directorType: null, code: 'V6070', prevcat: 8, sect: 3 },
  { name: 'أمين عام', cat: 17, domain: 'other', directorType: null, code: null, prevcat: 20, sect: 1 }
];

export const MONTHS_AR: Record<number, string> = {
  1: 'جانفي', 2: 'فيفري', 3: 'مارس', 4: 'أفريل', 5: 'ماي', 6: 'جوان',
  7: 'جويلية', 8: 'أوت', 9: 'سبتمبر', 10: 'أكتوبر', 11: 'نوفمبر', 12: 'ديسمبر'
};

export const WILAYAS69: string[] = [
  'أدرار', 'الشلف', 'الأغواط', 'أم البواقي', 'باتنة', 'بجاية', 'بسكرة', 'بشار',
  'البليدة', 'البويرة', 'تمنراست', 'تبسة', 'تلمسان', 'تيارت', 'تيزي وزو', 'الجزائر',
  'الجلفة', 'جيجل', 'سطيف', 'سعيدة', 'سكيكدة', 'سيدي بلعباس', 'عنابة', 'قالمة',
  'قسنطينة', 'المدية', 'مستغانم', 'المسيلة', 'معسكر', 'ورقلة', 'وهران', 'البيض',
  'إليزي', 'برج بوعريريج', 'بومرداس', 'الطارف', 'تندوف', 'تيسمسيلت', 'الوادي', 'خنشلة',
  'سوق أهراس', 'تيبازة', 'ميلة', 'عين الدفلى', 'النعامة', 'عين تموشنت', 'غرداية', 'غليزان',
  'تيميمون', 'برج باجي مختار', 'أولاد جلال', 'بني عباس', 'عين صالح', 'عين قزام', 'تقرت',
  'جانت', 'المغير', 'المنيعة', 'أفلو', 'بريكة', 'القنطرة', 'بئر العاتر', 'العريشة',
  'قصر الشلالة', 'عين وسارة', 'مسعد', 'قصر البخاري', 'بوسعادة', 'الأبيض سيدي الشيخ'
];

export const ALGERIAN_WILAYAS = WILAYAS69;

/**
 * ===== مركز الجداول والمعطيات =====
 * جداول النقطة الاستدلالية الرسمية (تُبذر افتراضياً وقابلة للتعديل من مركز الجداول)
 * القيمة الفعلية = basePoints + bonusPoints (آخر سطر ساري للسنة المطلوبة)
 * كل جدول يحمل شبكة النقاط الاستدلالية لكل صنف وكل درجة مرفوعة من الجرائد الرسمية
 */
import { PointTable, PointCell } from '../types';

/**
 * توليد خلايا الشبكة الرسمية (الرقم الاستدلالي لكل صنف وكل درجة)
 * من الشبكات المرفوعة من الجرائد الرسمية المدمجة في هذا الملف:
 * الرقم الكامل للدرجة n = معامل الأساس + الزيادة الاستدلالية للدرجة
 */
export function buildOfficialCells(year: number): PointCell[] {
  const grille = getGrilleForYear(year);
  const cells: PointCell[] = [];
  grille.forEach((g, gi) => {
    g.ech.forEach((inc, i) => {
      cells.push({
        id: `pc-${year}-${gi}-${i + 1}`,
        cat: g.cat,
        grade: i + 1,
        points: (Number(g.base) || 0) + (Number(inc) || 0),
        active: true
      });
    });
  });
  return cells;
}

export const DEFAULT_POINT_TABLES: PointTable[] = [
  {
    id: 'pt-2008',
    name: 'شبكة 2008 - 2021',
    decree: 'المرسوم الرئاسي 07-304',
    basePoints: 45,
    fromYear: 2008,
    toYear: 2021,
    note: 'النقطة الاستدلالية الأصلية',
    active: true,
    cells: buildOfficialCells(2008),
    rows: [
      { id: 'ptr-2008', label: 'النقطة الأصلية 45 دج', effectiveYear: 2008, bonusPoints: 0, note: 'سارية من جانفي 2008', active: true }
    ]
  },
  {
    id: 'pt-2022',
    name: 'شبكة 2022',
    decree: 'المرسوم الرئاسي 22-138',
    basePoints: 45,
    fromYear: 2022,
    toYear: 2022,
    note: '+50 نقطة استدلالية',
    active: true,
    cells: buildOfficialCells(2022),
    rows: [
      { id: 'ptr-2022', label: '+50 نقطة (المجموع 95 دج)', effectiveYear: 2022, bonusPoints: 50, note: 'سارية من مارس 2022', active: true }
    ]
  },
  {
    id: 'pt-2023',
    name: 'شبكة 2023 (المرحلة الأولى)',
    decree: 'المرسوم الرئاسي 23-54',
    basePoints: 45,
    fromYear: 2023,
    toYear: 2023,
    note: '+75 نقطة إضافية (مجموع 125)',
    active: true,
    cells: buildOfficialCells(2023),
    rows: [
      { id: 'ptr-2023', label: '+75 نقطة (المجموع 170 دج)', effectiveYear: 2023, bonusPoints: 125, note: 'سارية من جانفي 2023', active: true }
    ]
  },
  {
    id: 'pt-2024',
    name: 'شبكة 2024 - 2026 (المرحلة الثانية)',
    decree: 'المرسوم الرئاسي 23-54 + التنفيذي 25-55',
    basePoints: 45,
    fromYear: 2024,
    toYear: 2026,
    note: '+75 نقطة إضافية (مجموع 200) والنظام التعويضي 2025',
    active: true,
    cells: buildOfficialCells(2024),
    rows: [
      { id: 'ptr-2024', label: '+75 نقطة (المجموع 245 دج)', effectiveYear: 2024, bonusPoints: 200, note: 'سارية من جانفي 2024 — والنظام التعويضي 25-55 لسنة 2025', active: true }
    ]
  }
];

/**
 * المنح النظامية المدمجة في الحاسبة — تظهر في مركز الجداول مع إمكانية تعطيل كل واحدة
 * (المطابقة بالاسم: تطابق تام أو بداية الاسم)
 */
export const BUILTIN_ALLOWANCE_KEYS: { key: string; note: string }[] = [
  { key: 'المنحة الجزافية التعويضية', note: 'مبلغ ثابت حسب الصنف — تُحتسب آلياً' },
  { key: 'تعويض الخبرة البيداغوجية', note: '4% × الدرجة × الأجر القاعدي — سلك التعليم' },
  { key: 'تعويض التسيير المالي والمادي', note: '4% × الدرجة × الأجر القاعدي — المصلحة الاقتصادية' },
  { key: 'تعويض تسيير مؤسسة تعليمية', note: 'مبلغ ثابت 3000-5000 دج حسب المستوى' },
  { key: 'تعويض الخدمات التقنية', note: '25% من الأجر التصاعدي — المخابر' },
  { key: 'تعويض الضرر', note: '25% من الأجر التصاعدي — المخابر' },
  { key: 'تعويض الخدمات الإدارية المشتركة', note: 'نسبة حسب الرتبة — الأسلاك المشتركة' },
  { key: 'تعويض دعم نشاطات الإدارة', note: '10% من الأجر التصاعدي — الأسلاك المشتركة' },
  { key: 'منحة الأوراس', note: 'منحة منطقة الأوراس حسب الرتبة والأقدمية' },
  { key: 'علاوة المردودية', note: 'كل الصيغ: العمال المهنيون والمخابر وتحسين الأداء التربوي وفي التسيير' }
];
