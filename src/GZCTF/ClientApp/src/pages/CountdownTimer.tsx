import React, { useEffect, useState } from 'react';
import { Container, Title, Text } from '@mantine/core';
import api, { PostInfoModel, GameJoinModel, ParticipationStatus } from '@Api'
import '../styles/components/index.css'

const Countdown = () => {

  const { data: allGames } = api.game.useGameGamesAll({
    refreshInterval: 5 * 60 * 1000,
  })

  allGames?.sort((a, b) => new Date(a.end!).getTime() - new Date(b.end!).getTime())

  const now = new Date()
  const recentGames = [
    ...(allGames?.filter((g) => now < new Date(g.end ?? '')) ?? []),
    ...(allGames?.filter((g) => now >= new Date(g.end ?? '')).reverse() ?? []),
  ].slice(0, 3)

  let title = '距离 比赛开始 还有'
  let nowNew = new Date();
  let targetDate = new Date('2024-10-10T09:00:00');
  if (recentGames.length != 0) {
    targetDate = new Date(recentGames[0].start??'')
  }
  const isAfter = nowNew > targetDate;
  let isAfterEnd = true
  if(isAfter){
    if(nowNew>new Date(recentGames[0].end??'')){
      title = '比赛结束'
      isAfterEnd = false
    }else{
      targetDate =  new Date(recentGames[0].end??'')
      title = '距离 比赛结束 还有'
    }
  }
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  function getTimeLeft() {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    return { hours, minutes, seconds };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Container>
      <div className='Participate-text'>{title}</div>
      {isAfterEnd&&<Text className='downTimer'>
       <div className='downTimer-time'> {formatTime(timeLeft.hours)}</div> : <div className='downTimer-time'>{formatTime(timeLeft.minutes)}</div> : <div className='downTimer-time'>{formatTime(timeLeft.seconds)}</div>
      </Text>}
    </Container>
  );
};

export default Countdown;
