import React, { useEffect, useState } from 'react';
import uuid from 'react-uuid';


const dropboxToken = 'sl.BiXzWhw1IdXVfskh66lV1Q8NYU175ab3VuGwMjtzUlPPu5BSIPrPHQRgo4cWQvDXgBd9KgYiHUmBOaTUyO7EDLrMOVU__rxOFZ1hJfEEk4FrXQyu0blFp8ozyJhfBUaU4jf-8oM'; // Замените на ваш токен доступа Dropbox


function getNormalDate(dateS) {
  const dateString = dateS.slice(0, -2);
  const date = new Date(dateString);

  const formattedDate = `${(date.getDate()).toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}, ${(date.getHours()).toString().padStart(2, '0')}:${(date.getMinutes()).toString().padStart(2, '0')}:${(date.getSeconds()).toString().padStart(2, '0')}`;
  return formattedDate;
}

const FileData = ({ fileName, fileData }) => {
  console.log(fileName);
  const [latestEntry, setLatestEntry] = useState('');

  useEffect(() => {
    // Получение последней строки из данных
    const lines = fileData.split('\n');
    const lastLine = lines[lines.length - 2]; // Игнорируем последнюю пустую строку

    setLatestEntry(lastLine);
  }, [fileData]);

  // Разбивка последней строки на отдельные значения
  const entries = latestEntry.split('||').map(entry => entry.trim());

  // Получение значений из последней строки
  const [date, impressions, clicks, conversions, spend] = entries;

  return (
    <div className="bg-white rounded-md shadow-md p-4 mb-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">{fileName.split('.')[0]}</h2>
      </div>
      <div className="flex flex-col items-center">
        <div className="flex mb-2">
          <span className="font-semibold">Дата и время:</span>
          <span className="ml-2">{getNormalDate(date)}</span>
        </div>
        <div className="flex mb-2">
          <span className="font-semibold">Показы:</span>
          <span className="ml-2">{impressions && impressions.split(':')[1]}</span>
        </div>
        <div className="flex mb-2">
          <span className="font-semibold">Клики:</span>
          <span className="ml-2">{clicks && clicks.split(':')[1]}</span>
        </div>
        <div className="flex mb-2">
          <span className="font-semibold">Конверсии:</span>
          <span className="ml-2">{conversions && conversions.split(':')[1]}</span>
        </div>
        <div className="flex mb-2">
          <span className="font-semibold">Расход:</span>
          <span className="ml-2">{spend && spend.split(':')[1]}</span>
        </div>
      </div>
    </div>
  );
};

const FooterTable = ({ fileName, fileData }) => {
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    // Разбивка данных на отдельные строки
    const allTablesData = [[]]
    fileData = fileData.replace(/\s+\|\|/g, '||');
    const lines = fileData.split('\n');
    const rows = lines.map(line => line.split('||').map(entry => entry.trim()));

    rows.forEach((el, index) => {
      const last = allTablesData.length - 1;
      if (el[0] === '') {
        allTablesData.push([]);
      } else {
        allTablesData[last].push(el);
      }
    })

    setTableData(allTablesData);
  }, [fileData]);

  return (
    <div className="bg-white rounded-md shadow-md p-4 mb-4">
      <h2 className="text-xl font-bold mb-4">{fileName.split('.')[0]}</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 border">Дата и время</th>
            <th className="p-2 border">Уникальных</th>
            <th className="p-2 border">Глубина</th>
            <th className="p-2 border">Конверсий всего</th>
            <th className="p-2 border">Новых</th>
            <th className="p-2 border">В работе</th>
            <th className="p-2 border">Отказных</th>
            <th className="p-2 border">Треш</th>
            <th className="p-2 border">Сумма в работе</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr>
              {
                row.map((el, index) => (
                  (el && el[0] && el[0] !== '') ?
                  <td key={uuid()} className="p-2 border">{el[0].includes('(') ? getNormalDate(el[0]) : el[0]}</td>
                  :
                  ''
                ))
              }
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const App = () => {
  const [fileData, setFileData] = useState([]);

  useEffect(() => {
    const fetchFilesFromDropbox = async () => {
      try {
        const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${dropboxToken}`,
          },
          body: JSON.stringify({
            path: '/tests',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const files = data.entries;

          const promises = files.map(async (file) => {
            const fileResponse = await fetch('https://content.dropboxapi.com/2/files/download', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/octet-stream',
                Authorization: `Bearer ${dropboxToken}`,
                'Dropbox-API-Arg': JSON.stringify({
                  path: file.path_display,
                }),
              },
            });

            if (fileResponse.ok) {
              const fileData = await fileResponse.text();
              return { fileName: file.name, fileData };
            } else {
              console.error('Ошибка при загрузке файла из Dropbox:', file.name);
              return null;
            }
          });

          const fileData = await Promise.all(promises);
          setFileData(fileData.filter((file) => file !== null));
        } else {
          console.error('Ошибка при получении списка файлов из Dropbox:', response.status);
        }
      } catch (error) {
        console.error('Ошибка при выполнении запроса к Dropbox API:', error);
      }
    };

    fetchFilesFromDropbox();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Данные файлов</h1>
      {fileData.map(({ fileName, fileData }) => (
        <React.Fragment key={fileName}>
          {fileName.includes('statistic_pb') ? (
            <FooterTable fileName={fileName} fileData={fileData} />
          ) : (
            <FileData fileName={fileName} fileData={fileData} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default App;