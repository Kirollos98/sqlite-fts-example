import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {openDatabase} from 'react-native-sqlite-storage';

import bibleData from './ar_svd.json';

const db = openDatabase({
  name: 'bibleSqliteTest',
});

const App = () => {
  const createTable = () => {
    db.transaction(txn => {
      txn.executeSql(
        //CREATE VIRTUAL TABLE posts
        //USING FTS5(title, body)
        'CREATE TABLE IF NOT EXISTS verses (id INTEGER PRIMARY KEY AUTOINCREMENT, verse TEXT)',
        [],
        (salTxn, res) => {
          console.log('table has been created successfully');
        },
        error => {
          console.log('error creating table', error);
        },
      );
    });

    db.transaction(txn => {
      txn.executeSql(
        //CREATE VIRTUAL TABLE posts
        //USING FTS5(title, body)
        'CREATE VIRTUAL TABLE IF NOT EXISTS verses_indexed USING fts5(verse)',
        [],
        (salTxn, res) => {
          console.log('VIRTUAL table has been created successfully');
        },
        error => {
          console.log('error creating table', error);
        },
      );
    });
  };

  const [verseList, setVerseList] = useState([]);
  const [verseSearch, setVerseSearch] = useState('');

  const insertVerses = () => {
    bibleData.forEach(({chapters}) => {
      chapters.forEach(chapter => {
        chapter.forEach(async (verseToInsert, index) => {
          db.transaction(txn => {
            txn.executeSql(
              'INSERT INTO verses_indexed (verse) VALUES (?)', //'INSERT INTO verses_indexed VALUES (?)'
              [verseToInsert],
              (salTxn, res) => {
                console.log(`${verseToInsert} is created successfully`);
              },
              err => {
                console.log('error happened while inserting verse', err);
              },
            );
          });
        });

      });
    });
  };

  useEffect(() => {
    createTable();
    // db.transaction(txn => {
    //   txn.executeSql(
    //     'SELECT * from verses',
    //     (salTxn, res) => {
    //       console.log('selection was successful');
    //       // setVerseList(res);
    //     },
    //     err => {
    //       console.log('error during selection', err.message);
    //     },
    //   );
    // });

    const fetchData = async () => {
      await SelectQuery('SELECT * FROM verses_indexed', []);
    };

    fetchData();

    // console.log('verseList', verseList);
  }, []);

  useEffect(() => {
    console.log('verseList', verseList.length);
  }, [verseList]);

  /**
   * Execute sql queries
   *
   * @param sql
   * @param params
   *
   * @returns {resolve} results
   */
  const ExecuteQuery = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.transaction(trans => {
        trans.executeSql(
          sql,
          params,
          (trans, results) => {
            resolve(results);
          },
          error => {
            reject(error);
          },
        );
      });
    });
  /**
   * Select Query Example
   */
  const SelectQuery = async (sqlStatement, params) => {
    let selectQuery = await ExecuteQuery(sqlStatement, [...params]);
    const rows = selectQuery.rows;
    const _verses = [];
    for (let i = 0; i < rows.length; i++) {
      const item = rows.item(i);
      _verses.push(item);
    }

    setVerseList(_verses);
  };
  return (
    <SafeAreaView>
      <Text>App</Text>
      <TextInput
        style={{
          borderWidth: 2,
          borderRadius: 10,
          width: '80%',
          height: 40,
          padding: 10,
          marginHorizontal: 35,
        }}
        placeholder="search here"
        onChangeText={text => {
          setVerseSearch(text);
          const searchTermArr = text.split(' ');
          console.log('searchterm', searchTermArr);
          if (searchTermArr.length) {
            console.log('searchterm', searchTermArr?.length);
          }
          const searchTermFormatted = searchTermArr.map((item, index) =>
            index === searchTermArr.length - 1 ? `${item}` : `${item}+`,
          );
          let finalSearchQuery = '';
          searchTermFormatted.forEach(searchWord => {
            finalSearchQuery += searchWord;
          });
          console.log('finalSearchQuery', finalSearchQuery);
          if (text === '') {
            SelectQuery('SELECT * FROM verses_indexed', []);
          } else {
            SelectQuery(
              'SELECT * FROM verses_indexed WHERE verses_indexed MATCH ?',
              [text],
            );
          }
        }}
      />
      <TouchableOpacity
        onPress={insertVerses}
        style={{
          height: 40,
          width: '80%',
          padding: 10,
          marginHorizontal: 30,
          justifyContent: 'center',
          backgroundColor: 'gray',
          borderRadius: 20,
        }}>
        <Text style={{alignSelf: 'center'}}>add Verses</Text>
      </TouchableOpacity>

      <FlatList
        style={{marginBottom: 100, padding: 20}}
        data={verseList || []}
        renderItem={({item}) => {
          return <Text style={{fontSize: 20}}>{item?.verse}</Text>;
        }}
      />
    </SafeAreaView>
  );
};

export default App;
