import { Injectable } from '@nestjs/common';
import { Manuscript } from './manuscript.interface';

@Injectable()
export class ManuscriptFirstLabService {
  private readonly manuscripts: Manuscript[] = [
    {
      id: 1,
      title: 'Остромирово Евангелие',
      description: 'Остромирово Евангелие — древнейшая точно датированная русская книга, созданная в 1056–1057 годах для новгородского посадника Остромира. Памятник написан уставом — торжественным почерком с геометрически правильными буквами. Буква «ять» здесь имеет высокую мачту с раздвоенной верхушкой, что характерно для раннего кириллического устава XI века. Наличие этой формы позволяет датировать рукопись серединой XI столетия.',
      century: 11,
      sign: 'Начертание «ять»',
      image: 'ostromir.jpg',
      video: 'ostromir.mp4',
      status: 'published',
      likes: [1, 2, 3, 4, 5],
    },
    {
      id: 2,
      title: 'Архангельское Евангелие',
      description: 'Архангельское Евангелие 1092 года — один из немногих точно датированных памятников домонгольской Руси. Текст выполнен уставом с заметным наклоном и лёгкой неровностью строк. Твёрдый знак «ъ» пишется с длинной вертикальной мачтой и небольшим закруглением справа. Такое начертание типично для рукописей конца XI века и служит важным палеографическим признаком при датировке.',
      century: 11,
      sign: 'Твёрдый знак «ъ»',
      image: 'arhangelsk.jpg',
      video: 'arhangelsk.mp4',
      status: 'published',
      likes: [1, 2, 3],
    },
    {
      id: 3,
      title: 'Киевская Псалтирь',
      description: 'Киевская Псалтирь 1397 года — один из древнейших сохранившихся списков Псалтири на Руси. Рукопись написана уставом, близким к южнославянским образцам, с чёткой геометричностью букв. Буква «ять» сохраняет высокую мачту и раздвоенную верхушку, но становится уже и строже по форме. Эти признаки указывают на конец XIV века и переход к полууставной манере письма.',
      century: 14,
      sign: 'Начертание «ять»',
      image: 'kiev.jpg',
      video: 'kiev.mp4',
      status: 'published',
      likes: [2, 4, 6, 7],
    },
    {
      id: 4,
      title: 'Евангелие Хитрово',
      description: 'Евангелие Хитрово конца XIV века — роскошный памятник московской книжной традиции. Письмо представляет собой переходный тип между уставом и полууставом. Твёрдый знак «ъ» пишется с укороченной мачтой и более округлым нижним элементом. Это начертание характерно для рукописей рубежа XIV–XV веков и помогает уточнить время создания книги.',
      century: 14,
      sign: 'Твёрдый знак «ъ»',
      image: 'hitrovo.jpg',
      video: 'hitrovo.mp4',
      status: 'published',
      likes: [1, 5, 8],
    },
    {
      id: 5,
      title: 'Черновик услуги',
      description: 'Черновая запись услуги, требующая уточнения по палеографическим признакам. Предположительно связана с начертанием буквы «фита» в поздних полууставных рукописях. Точная датировка пока не установлена и требует дополнительного анализа. Запись не отображается в публичной ленте и доступна только на странице добавления.',
      century: 15,
      sign: 'Начертание «фита»',
      image: 'draft.jpg',
      video: 'ostromir.mp4',
      status: 'draft',
      likes: [],
    },
  ];

  getAllVisible(): Manuscript[] {
    return this.manuscripts.filter(m => m.status !== 'deleted');
  }

  getPublished(): Manuscript[] {
    return this.manuscripts.filter(m => m.status === 'published');
  }

  getDraft(): Manuscript | undefined {
    return this.manuscripts.find(m => m.status === 'draft');
  }

  getById(id: number): Manuscript | undefined {
    return this.manuscripts.find(m => m.id === id && m.status !== 'deleted');
  }

  getNext(id: number): Manuscript | undefined {
    const visible = this.getPublished();
    const currentIndex = visible.findIndex(m => m.id === id);
    if (currentIndex === -1 || currentIndex === visible.length - 1) {
      return visible[0];
    }
    return visible[currentIndex + 1];
  }

  filterByCentury(century?: number): Manuscript[] {
    const visible = this.getPublished();
    if (century === undefined || isNaN(century)) return visible;
    return visible.filter(m => m.century === century);
  }
}