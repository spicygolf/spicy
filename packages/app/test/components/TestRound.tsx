import React, { ReactNode, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
// @ts-ignore FIXME
// import { Doc } from '@fireproof/core';
// import { useFireproof } from '@fireproof/react-native';
import { ID } from "spicylib/types";

type Props = {
  roundId: ID;
};

const TestRound = ({roundId}: Props): ReactNode => {
  const roundDbName = `round_${roundId}`;
  const {database: roundDb} = useFireproof(roundDbName, {public: true});
  const [docs, setDocs] = useState<Doc[]>([]);

  const fetchData = async () => {
    let { rows: roundRows } = await roundDb.allDocs();
    setDocs([...roundRows]);
  };

  useEffect(
    () => {
      if (docs.length === 0) {
        fetchData();
      }
    }, []
  );

  return (
    <View>
      {
        docs?.map((doc, i) => {
          const v = doc.value;
          let display;
          switch (v._type) {
            case 'round':
              display = `created: ${v.created} seq: ${v.seq}`;
              break;
            case 'score_kv':
              display = `seq: ${v.seq} gross: ${v.v}`;
              break;
          }
          return (
            <View key={i}>
              <Text>{doc.value._type} - {display}</Text>
            </View>
          );
        })
      }
    </View>
  );
};

export default TestRound;
