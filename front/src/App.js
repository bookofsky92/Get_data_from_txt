import React, { useEffect, useState } from 'react';
import dropbox from 'dropbox';

const dropboxToken = 'sl.BiR5e9VDVpcDv4njcpm5iWSrtISIhpihwVdErvOBA0N579IsxFJV4bcCIdnR1iYCik8tU3nF1dJ5w96HL2dtt5crHXJ-HAmQ0g7jAE8aQ5cp03q5p1IldJ673O24cckYIc2ZpU4'; // Замените на ваш токен доступа Dropbox

const FileData = ({ fileName, fileData }) => {
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
        <h2 className="text-xl font-bold">{fileName}</h2>
      </div>
      <div className="flex flex-col items-center">
        <div className="flex mb-2">
          <span className="font-semibold">Дата и время:</span>
          <span className="ml-2">{date}</span>
        </div>
        <div className="flex mb-2">
          <span className="font-semibold">Показы:</span>
          <span className="ml-2">{impressions}</span>
        </div>
        <div className="flex mb-2">
          <span className="font-semibold">Клики:</span>
          <span className="ml-2">{clicks}</span>
        </div>
        <div className="flex mb-2">
          <span className="font-semibold">Конверсии:</span>
          <span className="ml-2">{conversions}</span>
        </div>
        <div className="flex mb-2">
          <span className="font-semibold">Расход:</span>
          <span className="ml-2">{spend}</span>
        </div>
      </div>
    </div>
  );
};

const FooterTable = ({ fileName, fileData }) => {
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    // Разбивка данных на отдельные строки
    const lines = fileData.split('\n');
    const rows = lines.map(line => line.split('||').map(entry => entry.trim()));

    setTableData(rows);
  }, [fileData]);

  return (
    <div className="bg-white rounded-md shadow-md p-4 mb-4">
      <h2 className="text-xl font-bold mb-4">{fileName}</h2>
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
            <tr key={index}>
              {row.map((entry, idx) => (
                <td key={idx} className="p-2 border">{entry}</td>
              ))}
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
    // Инициализация Dropbox
    const dbx = new dropbox.Dropbox({ accessToken: dropboxToken });

    // Получение списка файлов
    dbx.filesListFolder({ path: '/' })
      .then(response => {
        const files = response.entries;
        const promises = files.map(file => {
          // Загрузка содержимого каждого файла
          return dbx.filesDownload({ path: file.path_display })
            .then(fileData => {
              const data = fileData.fileBinary.toString();
              setFileData(prevData => [...prevData, { fileName: file.name, fileData: data }]);
            });
        });

        Promise.all(promises)
          .catch(error => {
            console.error('Ошибка при загрузке файлов из Dropbox:', error);
          });
      })
      .catch(error => {
        console.error('Ошибка при получении списка файлов из Dropbox:', error);
      });
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Данные файлов</h1>
      {fileData.map(({ fileName, fileData }) => (
        <React.Fragment key={fileName}>
          {fileName.includes('summary') ? (
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